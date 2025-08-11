"""OAuth handlers for Google and GitHub SSO integration."""

import json
import base64
from flask import current_app, redirect
from flask_dance.contrib.github import github
from flask_dance.contrib.google import google
from flask_jwt_extended import create_access_token
import pdb


class OAuthHandler:
    """Helper class for OAuth operations."""
    
    @staticmethod
    def create_unique_username(base_username, provider_id):
        """Create a unique username by appending numbers if necessary."""
        from app.models import User
        
        username = base_username
        counter = 1
        
        while User.query.filter_by(username=username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        
        return username
    
    @staticmethod
    def get_google_user_data():
        """Fetch user data from Google API."""
        try:
            if not google.authorized:
                return None, 'Not authorized with Google'
        except Exception as e:
            return None, f'Google authorization check failed: {str(e)}'
        
        try:
            # Get user info
            resp = google.get('/oauth2/v2/userinfo')
            if not resp.ok:
                return None, f'Failed to fetch user info from Google. Status: {resp.status_code}'
            
            google_info = resp.json()
            
            return {
                'id': str(google_info['id']),
                'username': google_info.get('email', '').split('@')[0],
                'email': google_info['email'],
                'name': google_info.get('name', ''),
                'first_name': google_info.get('given_name', ''),
                'last_name': google_info.get('family_name', ''),
                'avatar_url': google_info.get('picture', ''),
                'verified_email': google_info.get('verified_email', False),
                'token': google.token
            }, None
            
        except Exception as e:
            return None, f'Google API error: {str(e)}'
    
    @staticmethod
    def get_github_user_data():
        """Fetch user data from GitHub API."""
        if not github.authorized:
            return None, 'Not authorized with GitHub'
        
        try:
            # Get user info
            resp = github.get('/user')
            if not resp.ok:
                return None, 'Failed to fetch user info from GitHub'
            
            github_info = resp.json()
            
            # Get user email
            email_resp = github.get('/user/emails')
            primary_email = None
            
            if email_resp.ok:
                emails = email_resp.json()
                primary_email = next(
                    (email['email'] for email in emails 
                     if email['primary'] and email['verified']), 
                    None
                )
            
            if not primary_email:
                primary_email = github_info.get('email')
            
            if not primary_email:
                return None, 'Could not get email from GitHub. Please ensure your GitHub email is public or verified.'
            
            return {
                'id': str(github_info['id']),
                'username': github_info.get('login', ''),
                'email': primary_email,
                'name': github_info.get('name', ''),
                'avatar_url': github_info.get('avatar_url', ''),
                'token': github.token
            }, None
            
        except Exception as e:
            return None, f'GitHub API error: {str(e)}'
    
    @staticmethod
    def find_or_create_user(provider, user_data):
        """Find existing user or create new one for OAuth login."""
        from app import db
        from app.models import User, OAuth
        
        provider_id = user_data['id']
        email = user_data['email']
        
        print(f"🔥 Looking for existing user with {provider}_id: {provider_id}")
        
        # Check if user exists with this OAuth provider ID
        provider_field = f'{provider}_id'
        user = User.query.filter(getattr(User, provider_field) == provider_id).first()
        
        if user:
            print(f"🔥 Found existing user with {provider} ID: {user.email}")
            return user, None
        
        print(f"🔥 No existing {provider} user found, checking email: {email}")
        
        # Check if user exists with same email
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"🔥 Found existing user by email, linking {provider} account")
            # Link OAuth account to existing user
            setattr(existing_user, provider_field, provider_id)
            try:
                db.session.commit()
                print(f"🔥 Successfully linked {provider} account to existing user")
                return existing_user, None
            except Exception as e:
                print(f"🔥 Error linking {provider} account: {str(e)}")
                db.session.rollback()
                return None, f"Database error: {str(e)}"
        
        print(f"🔥 Creating new user for {provider}")
        
        # Create new user
        if provider == 'github':
            name_parts = user_data.get('name', '').split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            username = OAuthHandler.create_unique_username(
                user_data['username'] or f'github_user_{provider_id}',
                provider_id
            )
        else:  # google
            first_name = user_data.get('first_name', '')
            last_name = user_data.get('last_name', '')
            username = OAuthHandler.create_unique_username(
                user_data['username'] or f'google_user_{provider_id}',
                provider_id
            )
        
        print(f"🔥 Creating user: username={username}, email={email}, first_name={first_name}, last_name={last_name}")
        
        user = User(
            username=username,
            firstName=first_name,
            lastName=last_name,
            email=email
        )
        
        # Set provider ID
        setattr(user, provider_field, provider_id)
        print(f"🔥 Set {provider_field} = {provider_id}")
        
        try:
            db.session.add(user)
            print(f"🔥 Added user to session")
            db.session.commit()
            print(f"🔥 Successfully committed user to database, ID: {user.id}")
            
            # Verify user was actually saved
            verification_user = User.query.filter_by(email=email).first()
            if verification_user:
                print(f"🔥 Verification: User exists in database with ID: {verification_user.id}")
            else:
                print(f"🔥 WARNING: User not found in database after commit!")
                
            return user, None
        except Exception as e:
            print(f"🔥 Error saving user to database: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return None, f"Database error: {str(e)}"

    @staticmethod
    def handle_oauth_callback(provider):
        """Handle OAuth callback for the given provider."""
        from app import db
        
        print(f"🔥 OAuth callback started for provider: {provider}")
        
        try:
            # Get user data from provider
            if provider == 'github':
                print("🔥 Getting GitHub user data...")
                user_data, error = OAuthHandler.get_github_user_data()
            elif provider == 'google':
                print("🔥 Getting Google user data...")
                user_data, error = OAuthHandler.get_google_user_data()
            else:
                print(f"🔥 Unknown provider: {provider}")
                return redirect('http://localhost:3000/auth/error?message=Unknown provider')
            
            print(f"🔥 User data result: {user_data is not None}, Error: {error}")
            
            if error:
                print(f"🔥 Error getting user data: {error}")
                current_app.logger.error(f"OAuth error for {provider}: {error}")
                return redirect(f'http://localhost:3000/auth/error?message={error}')
            
            if not user_data:
                print("🔥 No user data received")
                return redirect('http://localhost:3000/auth/error?message=No user data received')
            
            print(f"🔥 User data received: email={user_data.get('email')}, id={user_data.get('id')}")
            
            # Find or create user
            print("🔥 Finding or creating user...")
            user, user_error = OAuthHandler.find_or_create_user(provider, user_data)
            
            if user_error:
                print(f"🔥 User creation error: {user_error}")
                current_app.logger.error(f"User creation error: {user_error}")
                return redirect(f'http://localhost:3000/auth/error?message={user_error}')
            
            print(f"🔥 User found/created: {user.email} (ID: {user.id})")
            
            # Create JWT token
            print("🔥 Creating JWT token...")
            access_token = create_access_token(identity=user.id)
            
            # Prepare user data for frontend
            user_response = {
                'id': user.id,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'username': user.username
            }
            
            # Encode user data as base64 to pass in URL
            user_data_b64 = base64.b64encode(json.dumps(user_response).encode()).decode()
            
            print(f"🔥 OAuth success for {provider}: user {user.email} logged in with token")
            current_app.logger.info(f"OAuth success for {provider}: user {user.email} logged in")
            
            # Redirect to frontend with token and user data
            redirect_url = f'http://localhost:3000/auth/callback?token={access_token}&user={user_data_b64}&provider={provider}'
            print(f"🔥 Redirecting to: {redirect_url[:100]}...")
            return redirect(redirect_url)
            
        except Exception as e:
            print(f"🔥 Exception in OAuth callback: {str(e)}")
            import traceback
            traceback.print_exc()
            current_app.logger.error(f"{provider.title()} OAuth error: {str(e)}")
            return redirect(f'http://localhost:3000/auth/error?message={provider.title()} login failed: {str(e)}')
