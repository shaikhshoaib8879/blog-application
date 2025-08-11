from flask import Blueprint, request, jsonify, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_dance.contrib.github import github
from flask_dance.contrib.google import google
from werkzeug.security import check_password_hash
import json
import pdb

from app import db, login_manager
from app.models import User, OAuth
from app.schemas import LoginSchema, RegisterSchema, TokenSchema, UserSchema

bp = Blueprint('auth_api', __name__)

# Initialize schemas
login_schema = LoginSchema()
register_schema = RegisterSchema()
token_schema = TokenSchema()
user_schema = UserSchema()

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login."""
    return User.query.get(int(user_id))

@bp.route('/login', methods=['POST'])
def login():
    pdb.set_trace()
    """Traditional login endpoint."""
    try:
        data = login_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': 'Validation error', 'details': str(e)}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify(token_schema.dump({
            'access_token': access_token,
            'user': user
        }))
    pdb.set_trace()
    return jsonify({'error': 'Invalid credentials'}), 401

@bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint."""
    try:
        data = register_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': 'Validation error', 'details': str(e)}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        firstName=data.get('firstName'),
        lastName=data.get('lastName'),
        email=data['email']
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify(token_schema.dump({
        'access_token': access_token,
        'user': user
    })), 201

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user_schema.dump(user))

@bp.route('/github')
def github_login():
    """GitHub OAuth login endpoint."""
    if not github.authorized:
        return jsonify({'error': 'Not authorized with GitHub'}), 401
    
    # Get user info from GitHub
    resp = github.get('/user')
    if not resp.ok:
        return jsonify({'error': 'Failed to fetch user info from GitHub'}), 400
    
    github_info = resp.json()
    github_user_id = str(github_info['id'])
    
    # Get user email
    email_resp = github.get('/user/emails')
    if email_resp.ok:
        emails = email_resp.json()
        primary_email = next((email['email'] for email in emails if email['primary']), None)
        if not primary_email:
            primary_email = github_info.get('email')
    else:
        primary_email = github_info.get('email')
    
    if not primary_email:
        return jsonify({'error': 'Could not get email from GitHub'}), 400
    
    # Find or create user
    user = User.query.filter_by(github_id=github_user_id).first()
    
    if not user:
        existing_user = User.query.filter_by(email=primary_email).first()
        if existing_user:
            existing_user.github_id = github_user_id
            user = existing_user
        else:
            user = User(
                username=github_info.get('login', ''),
                email=primary_email,
                github_id=github_user_id
            )
            db.session.add(user)
    
    # Store OAuth token
    token = github.token
    oauth = OAuth.query.filter_by(provider='github', user=user).first()
    if oauth:
        oauth.token = json.dumps(token)
    else:
        oauth = OAuth(
            provider='github',
            provider_user_id=github_user_id,
            token=json.dumps(token),
            user=user
        )
        db.session.add(oauth)
    
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify(token_schema.dump({
        'access_token': access_token,
        'user': user
    }))

@bp.route('/google')
def google_login():
    pdb.set_trace()
    """Google OAuth login endpoint."""
    if not google.authorized:
        return jsonify({'error': 'Not authorized with Google'}), 401
    
    # Get user info from Google
    resp = google.get('/oauth2/v2/userinfo')
    if not resp.ok:
        return jsonify({'error': 'Failed to fetch user info from Google'}), 400
    
    google_info = resp.json()
    google_user_id = google_info['id']
    
    # Find or create user
    pdb.set_trace()
    user = User.query.filter_by(google_id=google_user_id).first()
    
    if not user:
        existing_user = User.query.filter_by(email=google_info['email']).first()
        if existing_user:
            existing_user.google_id = google_user_id
            user = existing_user
        else:
            user = User(
                username=google_info.get('name', '').replace(' ', '_').lower(),
                email=google_info['email'],
                google_id=google_user_id
            )
            db.session.add(user)
    
    # Store OAuth token
    token = google.token
    oauth = OAuth.query.filter_by(provider='google', user=user).first()
    if oauth:
        oauth.token = json.dumps(token)
    else:
        oauth = OAuth(
            provider='google',
            provider_user_id=google_user_id,
            token=json.dumps(token),
            user=user
        )
        db.session.add(oauth)
    
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify(token_schema.dump({
        'access_token': access_token,
        'user': user
    }))
