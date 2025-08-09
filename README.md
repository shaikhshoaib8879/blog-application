# Flask Blog API

A RESTful API for a blog application built with Flask, featuring JWT authentication, OAuth (GitHub & Google), and PostgreSQL database.

## Features

- JWT-based authentication
- OAuth integration (GitHub, Google)
- CRUD operations for blog posts
- User management
- PostgreSQL database
- CORS support for frontend integration
- RESTful API design

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL
- Virtual environment (recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-application
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Setup PostgreSQL database:
```bash
# Create database
createdb blog_db

# Update DATABASE_URL in .env file
DATABASE_URL=postgresql://username:password@localhost:5432/blog_db
```

6. Run the application:
```bash
python run.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/google` - Google OAuth login

### Posts
- `GET /api/posts` - Get all published posts
- `GET /api/posts/<id>` - Get specific post
- `POST /api/posts` - Create new post (requires auth)
- `PUT /api/posts/<id>` - Update post (requires auth & ownership)
- `DELETE /api/posts/<id>` - Delete post (requires auth & ownership)
- `GET /api/posts/my-posts` - Get current user's posts (requires auth)

### Users
- `GET /api/users/profile` - Get current user profile (requires auth)
- `PUT /api/users/profile` - Update profile (requires auth)
- `GET /api/users/<id>` - Get public user info

## Configuration

### Environment Variables

```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://username:password@localhost:5432/blog_db
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CORS_ORIGINS=http://localhost:3000
```

### OAuth Setup

#### GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:5000/api/auth/github/authorized`
4. Copy Client ID and Client Secret to .env file

#### Google OAuth App
1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set redirect URI to: `http://localhost:5000/api/auth/google/authorized`
6. Copy Client ID and Client Secret to .env file

## Development

The API runs on `http://localhost:5000` by default and is configured to accept CORS requests from `http://localhost:3000` (React frontend).

### Database Schema

- **Users**: id, username, email, password_hash, created_at, is_active, github_id, google_id
- **Posts**: id, title, content, created_at, updated_at, published, user_id
- **OAuth**: id, provider, provider_user_id, token, user_id

### Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Testing

```bash
# Run tests (if implemented)
python -m pytest

# Test API endpoints
curl -X GET http://localhost:5000/api/posts
```

## Production Deployment

1. Set `FLASK_ENV=production`
2. Use a production WSGI server like Gunicorn
3. Configure proper PostgreSQL database
4. Set secure secrets and OAuth credentials
5. Configure CORS_ORIGINS for your frontend domain
