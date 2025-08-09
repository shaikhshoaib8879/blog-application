from flask import render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from flask_dance.contrib.github import github
from flask_dance.contrib.google import google
from werkzeug.urls import url_parse
import json

from app import db, login_manager
from app.auth import bp
from app.auth.forms import LoginForm, RegistrationForm
from app.models import User, OAuth

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login."""
    return User.query.get(int(user_id))

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Traditional login route."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            if not next_page or url_parse(next_page).netloc != '':
                next_page = url_for('main.index')
            flash('Logged in successfully!', 'success')
            return redirect(next_page)
        flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html', title='Sign In', form=form)

@bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration route."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        # Check if user already exists
        if User.query.filter_by(email=form.email.data).first():
            flash('Email already registered', 'error')
            return redirect(url_for('auth.register'))
        
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already taken', 'error')
            return redirect(url_for('auth.register'))
        
        # Create new user
        user = User(
            username=form.username.data,
            email=form.email.data
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful!', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html', title='Register', form=form)

@bp.route('/logout')
@login_required
def logout():
    """Logout route."""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

# GitHub OAuth routes
@bp.route('/github')
def github_login():
    """Initiate GitHub OAuth login."""
    if not github.authorized:
        return redirect(url_for('github.login'))
    
    # Get user info from GitHub
    resp = github.get('/user')
    if not resp.ok:
        flash('Failed to fetch user info from GitHub.', 'error')
        return redirect(url_for('auth.login'))
    
    github_info = resp.json()
    github_user_id = str(github_info['id'])
    
    # Get user email from GitHub
    email_resp = github.get('/user/emails')
    if email_resp.ok:
        emails = email_resp.json()
        primary_email = next((email['email'] for email in emails if email['primary']), None)
        if not primary_email:
            primary_email = github_info.get('email')
    else:
        primary_email = github_info.get('email')
    
    if not primary_email:
        flash('Could not get email from GitHub. Please use traditional login.', 'error')
        return redirect(url_for('auth.login'))
    
    # Find or create user
    user = User.query.filter_by(github_id=github_user_id).first()
    
    if not user:
        # Check if user exists with this email
        existing_user = User.query.filter_by(email=primary_email).first()
        if existing_user:
            # Link GitHub account to existing user
            existing_user.github_id = github_user_id
            user = existing_user
        else:
            # Create new user
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
    login_user(user)
    flash('Successfully logged in with GitHub!', 'success')
    return redirect(url_for('main.index'))

# Google OAuth routes
@bp.route('/google')
def google_login():
    """Initiate Google OAuth login."""
    if not google.authorized:
        return redirect(url_for('google.login'))
    
    # Get user info from Google
    resp = google.get('/oauth2/v2/userinfo')
    if not resp.ok:
        flash('Failed to fetch user info from Google.', 'error')
        return redirect(url_for('auth.login'))
    
    google_info = resp.json()
    google_user_id = google_info['id']
    
    # Find or create user
    user = User.query.filter_by(google_id=google_user_id).first()
    
    if not user:
        # Check if user exists with this email
        existing_user = User.query.filter_by(email=google_info['email']).first()
        if existing_user:
            # Link Google account to existing user
            existing_user.google_id = google_user_id
            user = existing_user
        else:
            # Create new user
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
    login_user(user)
    flash('Successfully logged in with Google!', 'success')
    return redirect(url_for('main.index'))
