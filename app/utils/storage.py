import os
import uuid
from typing import Optional, Dict
from flask import current_app

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:  # pragma: no cover
    boto3 = None
    BotoCoreError = ClientError = Exception


def save_local(file_stream, filename: str, subdir: str = "uploads") -> Dict[str, str]:
    root = os.path.join(current_app.root_path, 'static', subdir)
    os.makedirs(root, exist_ok=True)
    path = os.path.join(root, filename)
    with open(path, 'wb') as f:
        f.write(file_stream.read())
    rel_url = f"/static/{subdir}/{filename}"
    return {"url": rel_url}


def save_s3(file_stream, filename: str, content_type: Optional[str] = None) -> Dict[str, str]:
    if not boto3:
        raise RuntimeError("boto3 not installed")
    bucket = current_app.config.get('S3_BUCKET')
    endpoint = current_app.config.get('S3_ENDPOINT_URL')
    region = current_app.config.get('S3_REGION')
    access_key = current_app.config.get('S3_ACCESS_KEY_ID')
    secret_key = current_app.config.get('S3_SECRET_ACCESS_KEY')
    public_base = current_app.config.get('S3_PUBLIC_BASE_URL')

    if not all([bucket, access_key, secret_key]):
        raise RuntimeError("Missing S3 configuration")

    session = boto3.session.Session()
    s3 = session.client(
        's3',
        region_name=region,
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )
    key = filename
    extra = {'ACL': 'public-read'}
    if content_type:
        extra['ContentType'] = content_type

    try:
        s3.upload_fileobj(file_stream, bucket, key, ExtraArgs=extra)
    except (BotoCoreError, ClientError) as e:  # pragma: no cover
        raise RuntimeError(f"S3 upload failed: {str(e)}")

    if public_base:
        url = f"{public_base.rstrip('/')}/{key}"
    else:
        # Generic path if bucket is public at endpoint
        url = f"{(endpoint or '').rstrip('/')}/{bucket}/{key}"

    return {"url": url}


def store_file(file_storage, subdir: str = "uploads") -> Dict[str, str]:
    """Store file in configured backend and return a dict with public 'url'."""
    storage = current_app.config.get('STORAGE_DRIVER', 'local')
    ext = (file_storage.filename or '').rsplit('.', 1)[-1].lower() if '.' in (file_storage.filename or '') else 'bin'
    filename = f"{uuid.uuid4().hex}.{ext}"

    if storage == 's3':
        return save_s3(file_storage.stream, f"{subdir}/{filename}", file_storage.mimetype)
    return save_local(file_storage.stream, filename, subdir=subdir)
