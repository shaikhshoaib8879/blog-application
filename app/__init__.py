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
    
    # JWT error handlers for clearer responses (avoid silent 422s)
    from flask_jwt_extended import (
        jwt_required,
        get_jwt_identity,
    )
    
    @jwt.unauthorized_loader
    def _unauthorized(reason):
        return ({'error': 'Unauthorized', 'reason': reason}, 401)

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return ({'error': 'Invalid token', 'reason': reason}, 422)

    @jwt.expired_token_loader
    def _expired_token(header, payload):
        return ({'error': 'Token expired'}, 401)

    @jwt.needs_fresh_token_loader
    def _needs_fresh(header, payload):
        return ({'error': 'Fresh token required'}, 401)

    @jwt.revoked_token_loader
    def _revoked(header, payload):
        return ({'error': 'Token revoked'}, 401)
    
    # Configure CORS (allow common dev ports and Authorization header)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config['CORS_ORIGINS'],
                "supports_credentials": True,
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Content-Type", "Authorization"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            }
        },
    )
    
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
    
    from app.api.media import bp as media_bp
    app.register_blueprint(media_bp, url_prefix='/api/media')
    
    # Set up OAuth signal handlers
    from flask_dance.consumer import oauth_authorized
    
    @oauth_authorized.connect_via(github_bp)
    def github_logged_in(blueprint, token):
        """Handle GitHub OAuth callback."""
        from app.oauth_handler import OAuthHandler
        return OAuthHandler.handle_oauth_callback('github')
    
    @oauth_authorized.connect_via(google_bp)
    def google_logged_in(blueprint, token):
        """Handle Google OAuth callback."""  
        from app.oauth_handler import OAuthHandler
        return OAuthHandler.handle_oauth_callback('google')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        # Ensure new columns exist (SQLite simple runtime migration)
        try:
            from sqlalchemy import inspect, text
            insp = inspect(db.engine)
            cols = [c['name'] for c in insp.get_columns('user')]
            stmts = []
            if 'email_verified' not in cols:
                stmts.append("ALTER TABLE user ADD COLUMN email_verified BOOLEAN")
            if 'email_verified_at' not in cols:
                stmts.append("ALTER TABLE user ADD COLUMN email_verified_at DATETIME")
            for s in stmts:
                db.session.execute(text(s))
            if stmts:
                db.session.commit()
            # Ensure 'post' table has expected columns
            post_cols = [c['name'] for c in insp.get_columns('post')]
            post_stmts = []
            if 'excerpt' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN excerpt TEXT")
            if 'slug' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN slug VARCHAR(200)")
            if 'published_at' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN published_at DATETIME")
            if 'published' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN published BOOLEAN DEFAULT 0")
            if 'featured_image' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN featured_image VARCHAR(500)")
            if 'views' not in post_cols:
                post_stmts.append("ALTER TABLE post ADD COLUMN views INTEGER DEFAULT 0")
            for s in post_stmts:
                db.session.execute(text(s))
            if post_stmts:
                db.session.commit()
        except Exception:
            db.session.rollback()
        print("✅ Database tables created successfully!")
    
    return app
