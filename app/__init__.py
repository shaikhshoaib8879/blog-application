from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_dance.contrib.github import make_github_blueprint
from flask_dance.contrib.google import make_google_blueprint
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
jwt = JWTManager()

def create_app(config_name='default'):
    """Application factory pattern."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    
    # OAuth Blueprints
    github_bp = make_github_blueprint(
        client_id=app.config.get('GITHUB_CLIENT_ID'),
        client_secret=app.config.get('GITHUB_CLIENT_SECRET'),
        scope='user:email'
    )
    app.register_blueprint(github_bp, url_prefix='/api/auth')
    
    google_bp = make_google_blueprint(
        client_id=app.config.get('GOOGLE_CLIENT_ID'),
        client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
        scope=['openid', 'email', 'profile']
    )
    app.register_blueprint(google_bp, url_prefix='/api/auth')
    
    # Register API blueprints
    from app.api.health import bp as health_bp
    app.register_blueprint(health_bp, url_prefix='/api')
    
    from app.api.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from app.api.posts import bp as posts_bp
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    
    from app.api.users import bp as users_bp
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Create database tables
    with app.app_context():
        # Drop all tables and recreate them (for development)
        db.drop_all()
        db.create_all()
        print("✅ Database tables created successfully!")
    
    return app
