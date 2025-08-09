# Full-Stack Blog Application Setup Guide

This guide will help you set up a complete blog application with:
- **Backend**: Flask REST API with JWT authentication, OAuth (GitHub/Google), PostgreSQL
- **Frontend**: React TypeScript with Tailwind CSS

## Project Structure

```
/home/shoaib-shaikh/Desktop/projects/
├── blog-application/          # Flask Backend API
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── api/
│   │       ├── auth.py
│   │       ├── posts.py
│   │       ├── users.py
│   │       └── health.py
│   ├── config.py
│   ├── run.py
│   ├── requirements.txt
│   ├── .env
│   └── README.md
└── frontend-blog/             # React Frontend
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── utils/
    │   ├── types/
    │   └── App.tsx
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## Backend Setup (Already Done)

The Flask API is ready with:
- JWT authentication
- OAuth (GitHub, Google)
- CRUD operations for posts
- User management
- PostgreSQL support
- CORS configuration

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info
- `GET /api/posts` - All published posts
- `POST /api/posts` - Create post (auth required)
- `GET /api/posts/<id>` - Get specific post
- `PUT /api/posts/<id>` - Update post
- `DELETE /api/posts/<id>` - Delete post

## Frontend Setup Instructions

### 1. Initialize React App

```bash
cd /home/shoaib-shaikh/Desktop/projects/frontend-blog

# Create package.json
cat > package.json << 'EOF'
{
  "name": "frontend-blog",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@types/node": "^16.18.68",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "react-query": "^3.39.3",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  },
  "proxy": "http://localhost:5000"
}
EOF

# Install dependencies
npm install
```

### 2. Setup Tailwind CSS

```bash
# Initialize Tailwind
npx tailwindcss init -p

# Configure tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOF
```

### 3. Create Directory Structure

```bash
mkdir -p src/{components,pages,hooks,utils,types}
mkdir -p public
```

### 4. Create Core Files

#### public/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Blog Application" />
    <title>Blog App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

#### src/index.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### src/App.tsx
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostDetails from './pages/PostDetails';
import CreatePost from './pages/CreatePost';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/create-post" element={<CreatePost />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
```

#### src/types/index.ts
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
```

#### src/utils/api.ts
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 5. Key Components to Create

1. **Authentication Components**
   - Login form with email/password
   - Register form
   - OAuth buttons (GitHub, Google)
   - Protected route wrapper

2. **Blog Components**
   - Post list with pagination
   - Post details view
   - Create/Edit post form
   - User dashboard

3. **UI Components**
   - Navigation bar
   - Loading spinners
   - Error boundaries
   - Toast notifications

### 6. Authentication Flow

1. User logs in via form or OAuth
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. Token is included in API requests
5. Protected routes check for valid token

### 7. Environment Setup

Create `.env` file in frontend:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## Running the Applications

### Backend (Terminal 1)
```bash
cd /home/shoaib-shaikh/Desktop/projects/blog-application

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not done)
pip install -r requirements.txt

# Run the API
python run.py
```

### Frontend (Terminal 2)
```bash
cd /home/shoaib-shaikh/Desktop/projects/frontend-blog

# Install dependencies (if not done)
npm install

# Start React app
npm start
```

## Database Setup

1. Install PostgreSQL
2. Create database: `createdb blog_db`
3. Update `DATABASE_URL` in backend `.env` file
4. Tables will be created automatically when the app starts

## OAuth Setup

### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/authorized`
4. Add Client ID and Secret to backend `.env`

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://localhost:5000/api/auth/google/authorized`
4. Add Client ID and Secret to backend `.env`

## Features Implemented

✅ **Backend API**
- JWT Authentication
- OAuth (GitHub, Google)
- CRUD operations for posts
- User management
- PostgreSQL database
- CORS support

⏳ **Frontend (To be implemented)**
- React TypeScript app
- Tailwind CSS styling
- Authentication forms
- Blog post management
- OAuth integration
- Responsive design

The backend is fully functional and ready to use. Follow the frontend setup instructions to complete the full-stack application!
