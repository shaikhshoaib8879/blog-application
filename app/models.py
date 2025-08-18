from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(UserMixin, db.Model):
    """User model for authentication."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    firstName = db.Column(db.String(80), nullable=True)
    lastName = db.Column(db.String(80), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    # Email verification
    email_verified = db.Column(db.Boolean, default=False)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    
    # OAuth fields
    github_id = db.Column(db.String(100), unique=True, nullable=True)
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    
    # Relationship with posts
    posts = db.relationship('Post', backref='author', lazy=True)
    
    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Post(db.Model):
    """Blog post model."""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text, nullable=True)
    slug = db.Column(db.String(200), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)
    published = db.Column(db.Boolean, default=False)
    featured_image = db.Column(db.String(500), nullable=True)
    views = db.Column(db.Integer, default=0)
    
    # Foreign key to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def generate_slug(self):
        """Generate a URL-friendly slug from the title."""
        import re
        from urllib.parse import quote
        
        if not self.slug and self.title:
            # Convert to lowercase and replace spaces/special chars with hyphens
            slug = re.sub(r'[^a-zA-Z0-9\s]', '', self.title.lower())
            slug = re.sub(r'\s+', '-', slug).strip('-')
            
            # Ensure uniqueness
            base_slug = slug
            counter = 1
            while Post.query.filter_by(slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
    
    def __repr__(self):
        return f'<Post {self.title}>'

class OAuth(db.Model):
    """OAuth model for storing OAuth tokens."""
    id = db.Column(db.Integer, primary_key=True)
    provider = db.Column(db.String(50), nullable=False)
    provider_user_id = db.Column(db.String(100), nullable=False)
    token = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User')
    
    def __repr__(self):
        return f'<OAuth {self.provider}:{self.provider_user_id}>'
