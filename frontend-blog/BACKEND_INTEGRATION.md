# Backend Integration Instructions

## Quick Setup

Your React frontend is ready and running on `http://localhost:3000`. To integrate with your Flask backend:

### 1. Backend Requirements

Make sure your Flask backend has the following endpoints:

#### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### Blog Posts Endpoints  
```
GET /api/posts
GET /api/posts/:id
POST /api/posts
PUT /api/posts/:id
DELETE /api/posts/:id
GET /api/posts/search?q=query
```

#### Comments Endpoints
```
GET /api/posts/:id/comments
POST /api/posts/:id/comments
PUT /api/comments/:id
DELETE /api/comments/:id
```

### 2. CORS Configuration

Add CORS support to your Flask backend:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
```

### 3. Expected Response Formats

#### Login Response
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email@example.com",
    "firstName": "First",
    "lastName": "Last"
  },
  "token": "jwt_token_here"
}
```

#### Posts Response  
```json
{
  "posts": [
    {
      "id": "post_id",
      "title": "Post Title",
      "content": "Post content...",
      "excerpt": "Short excerpt",
      "published": true,
      "tags": ["tag1", "tag2"],
      "author": {
        "id": "author_id", 
        "username": "author_username",
        "firstName": "First",
        "lastName": "Last"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "totalPages": 2,
  "page": 1,
  "limit": 10
}
```

### 4. Start Your Backend

1. Navigate to your Flask backend directory:
   ```bash
   cd /home/shoaib-shaikh/Desktop/projects/blog-application
   ```

2. Start your Flask server on port 5000:
   ```bash
   python app.py  # or however you start your Flask app
   ```

3. The frontend is configured to connect to `http://localhost:5000/api`

### 5. Test the Integration

1. Start your Flask backend on `http://localhost:5000`
2. The React frontend is already running on `http://localhost:3000`
3. Try registering a new user or logging in
4. Check browser console for any API errors

### 6. Environment Configuration

Update `.env` file if your backend runs on a different port:

```env
REACT_APP_API_URL=http://localhost:YOUR_FLASK_PORT/api
```

## Features Ready to Test

✅ **User Authentication**
- Login/Register forms
- JWT token management  
- Protected routes
- Auto logout on token expiry

✅ **Blog Posts**
- Home page with latest posts
- Posts listing page with search
- Pagination support
- Post creation (UI ready)

✅ **UI Components**
- Responsive navigation
- Loading states
- Error handling
- Toast notifications

## Next Steps

1. Start your Flask backend
2. Test user registration/login
3. Create some test blog posts via your backend
4. See them appear in the frontend
5. Test the search functionality

Your frontend is fully ready to integrate with your Flask API!
