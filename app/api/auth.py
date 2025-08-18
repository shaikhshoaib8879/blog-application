from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_dance.contrib.github import github
from flask_dance.contrib.google import google
from werkzeug.security import check_password_hash
import json

from app import db, login_manager
from app.models import User, OAuth
from app.schemas import LoginSchema, RegisterSchema, TokenSchema, UserSchema
from app.utils import create_timed_token, verify_timed_token, send_email

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
    """Traditional login endpoint."""
    try:
        data = login_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': 'Validation error', 'details': str(e)}), 400
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        if not user.email_verified:
            return jsonify({'error': 'Email not verified'}), 403
        access_token = create_access_token(identity=str(user.id))
        return jsonify(token_schema.dump({
            'access_token': access_token,
            'user': user
        }))
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

    # Send verification email
    secret = current_app.config.get('SECRET_KEY', 'dev-secret-key')
    token = create_timed_token({'sub': 'verify_email', 'uid': user.id, 'email': user.email}, secret, 60*60*24)
    verify_url = f"http://127.0.0.1:5000/api/auth/verify-email?token={token}"
    send_email(user.email, 'Verify your email', f"Click to verify your email: {verify_url}")

    return jsonify({'message': 'Registration successful. Please verify your email to activate your account.'}), 201


@bp.route('/verify-email', methods=['GET'])
def verify_email():
    token = request.args.get('token', '')
    secret = current_app.config.get('SECRET_KEY', 'dev-secret-key')
    data = verify_timed_token(token, secret)
    frontend_base = 'http://localhost:3000'
    if not data or data.get('sub') != 'verify_email':
        return redirect(f"{frontend_base}/verify-email?status=failed&reason=invalid_or_expired")
    user = User.query.get(int(data['uid']))
    if not user:
        return redirect(f"{frontend_base}/verify-email?status=failed&reason=user_not_found")
    if not user.email_verified:
        user.email_verified = True
        from datetime import datetime
        user.email_verified_at = datetime.utcnow()
        db.session.commit()
    return redirect(f"{frontend_base}/verify-email?status=success")


@bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    body = request.get_json(force=True) or {}
    email = body.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    # Do not leak whether account exists or verified
    if user and not user.email_verified:
        secret = current_app.config.get('SECRET_KEY', 'dev-secret-key')
        token = create_timed_token({'sub': 'verify_email', 'uid': user.id, 'email': user.email}, secret, 60*60*24)
        verify_url = f"http://127.0.0.1:5000/api/auth/verify-email?token={token}"
        send_email(user.email, 'Verify your email', f"Click to verify your email: {verify_url}")
    return jsonify({'message': 'If your account needs verification, a new link has been sent.'})


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    body = request.get_json(force=True) or {}
    email = body.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    user = User.query.filter_by(email=email).first()
    # Do not leak account existence
    if user:
        secret = current_app.config.get('SECRET_KEY', 'dev-secret-key')
        token = create_timed_token({'sub': 'reset_password', 'uid': user.id}, secret, 60*60)
        reset_url = f"http://localhost:3000/reset-password?token={token}"
        send_email(email, 'Reset your password', f"Reset your password: {reset_url}")
    return jsonify({'message': 'If an account exists for that email, a reset link has been sent.'})


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    body = request.get_json(force=True) or {}
    token = body.get('token')
    new_password = body.get('password')
    if not token or not new_password:
        return jsonify({'error': 'Token and password are required'}), 400
    secret = current_app.config.get('SECRET_KEY', 'dev-secret-key')
    data = verify_timed_token(token, secret)
    if not data or data.get('sub') != 'reset_password':
        return jsonify({'error': 'Invalid or expired token'}), 400
    user = User.query.get(int(data['uid']))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password reset successful'})

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info."""
    user_id = get_jwt_identity()
    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'error': 'Invalid token identity'}), 401
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
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(token_schema.dump({
        'access_token': access_token,
        'user': user
    }))

@bp.route('/google')
def google_login():
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
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify(token_schema.dump({
        'access_token': access_token,
        'user': user
    }))
