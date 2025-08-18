import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///blog.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # OAuth Configuration
    GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID')
    GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET')
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    
    # Flask-Dance Configuration
    OAUTHLIB_INSECURE_TRANSPORT = os.environ.get('OAUTHLIB_INSECURE_TRANSPORT', '0') == '1'
    OAUTHLIB_RELAX_TOKEN_SCOPE = os.environ.get('OAUTHLIB_RELAX_TOKEN_SCOPE', '0') == '1'

    # S3-compatible Storage Configuration
    STORAGE_DRIVER = os.environ.get('STORAGE_DRIVER', 'local')  # 'local' | 's3'
    S3_ENDPOINT_URL = os.environ.get('S3_ENDPOINT_URL')  # e.g., https://<account>.r2.cloudflarestorage.com
    S3_REGION = os.environ.get('S3_REGION', 'auto')
    S3_BUCKET = os.environ.get('S3_BUCKET')
    S3_ACCESS_KEY_ID = os.environ.get('S3_ACCESS_KEY_ID')
    S3_SECRET_ACCESS_KEY = os.environ.get('S3_SECRET_ACCESS_KEY')
    S3_PUBLIC_BASE_URL = os.environ.get('S3_PUBLIC_BASE_URL')  # e.g., https://pub.example.com or r2.dev bucket domain

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
