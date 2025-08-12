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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published = db.Column(db.Boolean, default=False)
    
    # Foreign key to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
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
