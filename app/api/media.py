import os
import uuid
from urllib.parse import urlparse
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename  # noqa: F401 (kept for compatibility if used later)
import requests
from PIL import Image as PILImage
from app.utils.storage import store_file, save_s3

# Target sizes for consistency (width x height). Maintain aspect ratio via fit/thumbnail.
TARGET_SIZES = {
    'thumb': (320, 180),     # 16:9 small
    'medium': (800, 450),    # 16:9 content
    'large': (1280, 720),    # 16:9 hero
}

def _save_resized_variants(src_path: str, dest_dir: str, base_name: str):
    """Create resized variants for consistent rendering and return dict of urls."""
    variants = {}
    try:
        with PILImage.open(src_path) as im:
            im = im.convert('RGB') if im.mode in ('RGBA', 'P') else im
            for key, (w, h) in TARGET_SIZES.items():
                img = im.copy()
                # Create a letterboxed image to exact size while keeping aspect
                img.thumbnail((w, h), PILImage.LANCZOS)
                canvas = PILImage.new('RGB', (w, h), (255, 255, 255))
                ox = (w - img.width) // 2
                oy = (h - img.height) // 2
                canvas.paste(img, (ox, oy))
                variant_filename = f"{base_name}_{key}.jpg"
                variant_path = os.path.join(dest_dir, variant_filename)
                canvas.save(variant_path, format='JPEG', quality=85)
                variants[key] = f"/static/uploads/{variant_filename}"
    except Exception:
        # If resizing fails, just return empty variants; original still available
        return {}
    return variants

bp = Blueprint('media_api', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_upload_folder():
    """Get or create upload folder."""
    upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    return upload_folder

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload an image file."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, gif, webp'}), 400
    
    # If using S3, just store and return URL (no server-side variants for now)
    if current_app.config.get('STORAGE_DRIVER') == 's3':
        stored = store_file(file, subdir='uploads')
        return jsonify({'success': 1, 'file': {'url': stored['url']}})

    # Local: generate unique filename and save, then create variants
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    upload_folder = get_upload_folder()
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    base_name = os.path.splitext(unique_filename)[0]
    variants = _save_resized_variants(file_path, upload_folder, base_name)
    file_url = variants.get('medium') or f"/static/uploads/{unique_filename}"
    return jsonify({
        'success': 1,
        'file': {
            'url': file_url,
            'size': os.path.getsize(file_path),
            'variants': variants,
        }
    })

@bp.route('/upload-by-url', methods=['POST'])
@jwt_required()
def upload_by_url():
    """Upload an image from URL."""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    image_url = data['url']
    
    try:
        # Validate URL
        parsed_url = urlparse(image_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return jsonify({'error': 'Invalid URL'}), 400
        
        # Download image
        response = requests.get(image_url, timeout=10, stream=True)
        response.raise_for_status()
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return jsonify({'error': 'URL does not point to an image'}), 400
        
        # Determine file extension
        extension_map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        }
        file_extension = extension_map.get(content_type, 'jpg')
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # If using S3, stream to S3 directly
        if current_app.config.get('STORAGE_DRIVER') == 's3':
            from io import BytesIO
            bio = BytesIO(response.content)
            stored = save_s3(bio, f"uploads/{unique_filename}", content_type=content_type)
            file_url = stored['url']
            variants = {}
        else:
            upload_folder = get_upload_folder()
            file_path = os.path.join(upload_folder, unique_filename)
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            base_name = os.path.splitext(unique_filename)[0]
            variants = _save_resized_variants(file_path, upload_folder, base_name)
            file_url = variants.get('medium') or f"/static/uploads/{unique_filename}"
        return jsonify({
            'success': 1,
            'file': {
                'url': file_url,
                'size': os.path.getsize(file_path),
                'variants': variants,
            }
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to download image: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

@bp.route('/fetch-url', methods=['POST'])
def fetch_url():
    """Fetch URL metadata for link embedding."""
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    url = data['url']
    
    try:
        # Validate URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return jsonify({'error': 'Invalid URL'}), 400
        
        # Fetch URL
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'BlogApp LinkFetcher 1.0'
        })
        response.raise_for_status()
        
        # Parse basic metadata
        content = response.text
        title = 'Link'
        description = ''
        image = ''
        
        # Simple HTML parsing for meta tags
        import re
        
        # Extract title
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
        
        # Extract description
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if not desc_match:
            desc_match = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip()
        
        # Extract image
        img_match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
        if img_match:
            image = img_match.group(1).strip()
        
        return jsonify({
            'success': 1,
            'link': url,
            'meta': {
                'title': title[:100],  # Limit title length
                'description': description[:200],  # Limit description length
                'image': {
                    'url': image if image else None
                }
            }
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch URL: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to process URL: {str(e)}'}), 500
