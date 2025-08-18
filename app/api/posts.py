from flask import Blueprint, request, jsonify
import pdb
import json as _json
import time as _time
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app import db
from app.models import Post, User
from app.schemas import PostSchema

bp = Blueprint('posts_api', __name__)

# Initialize schemas
post_schema = PostSchema()
posts_schema = PostSchema(many=True)

@bp.route('', methods=['GET'])
def get_posts():
    """Get all published posts."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    posts = Post.query.filter_by(published=True).order_by(
        Post.created_at.desc()
    ).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': posts_schema.dump(posts.items),
        'pagination': {
            'page': posts.page,
            'pages': posts.pages,
            'per_page': posts.per_page,
            'total': posts.total,
            'has_next': posts.has_next,
            'has_prev': posts.has_prev
        }
    })

@bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get a specific post."""
    post = Post.query.get_or_404(post_id)
    
    # Check if post is published or user is the author
    current_user_id = None
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except:
        pass
    
    if not post.published and (not current_user_id or post.user_id != current_user_id):
        return jsonify({'error': 'Post not found'}), 404
    
    return jsonify(post_schema.dump(post))


def create_post():
    """Create a new post (lenient defaults to avoid validation pitfalls)."""
    # Ensure JWT is verified even if this function is called indirectly
    verify_jwt_in_request()
    body = request.get_json(force=True) or {}
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'error': 'Invalid token identity'}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    title = (body.get('title') or 'Untitled').strip() or 'Untitled'
    content = body.get('content')
    if not content:
        # Minimal Editor.js payload as string
        content = _json.dumps({
            'time': int(_time.time() * 1000),
            'blocks': [
                {'type': 'paragraph', 'data': {'text': ''}}
            ],
            'version': '2.30.8'
        })
    excerpt = body.get('excerpt') or None
    published = bool(body.get('published', False))
    featured_image = body.get('featured_image') or body.get('featuredImage')

    post = Post(
        title=title,
        content=content,
        excerpt=excerpt,
        published=published,
        featured_image=featured_image,
        user_id=user_id
    )

    # Generate slug
    post.generate_slug()

    # Set published_at if publishing
    if post.published:
        from datetime import datetime
        post.published_at = datetime.utcnow()

    db.session.add(post)
    db.session.commit()
    return jsonify(post_schema.dump(post)), 201

# Alias endpoint to support POST /api/post/new for draft creation
@bp.route('/new', methods=['POST'])
# @jwt_required()
def create_post_new():
    return create_post()

@bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """Update a post."""
    post = Post.query.get_or_404(post_id)
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'error': 'Invalid token identity'}), 401
    
    if post.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = post_schema.load(request.json, partial=True)
    except Exception as e:
        return jsonify({'error': 'Validation error', 'details': str(e)}), 400
    
    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    post.excerpt = data.get('excerpt', post.excerpt)
    post.published = data.get('published', post.published)
    post.featured_image = data.get('featured_image', post.featured_image)
    
    from datetime import datetime
    post.updated_at = datetime.utcnow()
    
    # Set published_at if publishing for the first time
    if post.published and not post.published_at:
        post.published_at = datetime.utcnow()
    
    # Regenerate slug if title changed
    if 'title' in data:
        post.generate_slug()
    db.session.commit()
    
    return jsonify(post_schema.dump(post))

# Alias endpoint to support /posts/<id>/update
@bp.route('/<int:post_id>/update', methods=['PUT', 'PATCH'])
@jwt_required()
def update_post_alias(post_id):
    return update_post(post_id)

@bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """Delete a post."""
    post = Post.query.get_or_404(post_id)
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'error': 'Invalid token identity'}), 401
    
    if post.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Post deleted successfully'}), 200

@bp.route('/my-posts', methods=['GET'])
@jwt_required()
def get_my_posts():
    """Get current user's posts."""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'error': 'Invalid token identity'}), 401
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    posts = Post.query.filter_by(user_id=user_id).order_by(
        Post.created_at.desc()
    ).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'data': posts_schema.dump(posts.items),
        'pagination': {
            'page': posts.page,
            'pages': posts.pages,
            'per_page': posts.per_page,
            'total': posts.total,
            'has_next': posts.has_next,
            'has_prev': posts.has_prev
        }
    })
