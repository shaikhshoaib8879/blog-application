from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import User
from app.schemas import UserSchema

bp = Blueprint('users_api', __name__)

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    return jsonify(user_schema.dump(user))

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    try:
        data = user_schema.load(request.json, partial=True)
    except Exception as e:
        return jsonify({'error': 'Validation error', 'details': str(e)}), 400
    
    # Check if username is already taken by another user
    if 'username' in data and data['username'] != user.username:
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    # Check if email is already taken by another user
    if 'email' in data and data['email'] != user.email:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        user.email = data['email']

    # Update optional profile fields
    if 'firstName' in data:
        user.firstName = data['firstName']
    if 'lastName' in data:
        user.lastName = data['lastName']
    
    db.session.commit()
    
    return jsonify(user_schema.dump(user))

@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get public user info."""
    user = User.query.get_or_404(user_id)
    
    # Return only public information
    return jsonify({
        'id': user.id,
        'username': user.username,
        'created_at': user.created_at
    })
