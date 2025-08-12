# Blog Frontend Application

A modern, responsive blog frontend application built with React, TypeScript, and Tailwind CSS. This application is designed to work with a Flask backend API and provides a complete blogging platform with authentication, post management, and social features.

## 🚀 Features

### Authentication & Authorization
- Manual login/register with email and password
- SSO authentication (Google, GitHub) - *Integration ready*
- Protected routes and role-based access
- JWT token management with automatic refresh
- Password reset functionality

### Blog Management
- Create, edit, and delete blog posts
- Rich text editor for content creation
- Draft and publish functionality
- Image upload support
- Tag and category management
- SEO-friendly URLs

### User Experience
- Responsive design for all devices
- Dark/light mode support (planned)
- Search and filtering capabilities
- Pagination for large datasets
- Real-time notifications
- User profiles and avatars

### Social Features
- Comment system with nested replies
- Like/unlike posts and comments
- User following system (planned)
- Social sharing (planned)

## 🛠 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Flask backend API running on `http://localhost:5000`

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd frontend-blog

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the environment example file and update with your configuration:

```bash
cp .env.example .env
```

Update the `.env` file with your backend API URL and other configurations:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id_here
```

### 3. Start the Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## 🔌 Backend Integration

This frontend is designed to work with a Flask backend API. The expected API endpoints include:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/github` - GitHub OAuth

### Blog Posts Endpoints
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/search` - Search posts
- `GET /api/users/:id/posts` - Get user's posts

### Comments Endpoints
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### User Profile Endpoints
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
├── pages/              # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── ...
├── context/            # React context providers
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   └── useBlogPosts.ts
├── services/           # API services
│   └── api.ts
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
├── index.tsx           # Entry point
└── index.css           # Global styles
```

## 🔑 Key Components

### AuthContext
Manages authentication state, login, logout, and user data across the application.

### API Service
Centralized API calls with interceptors for authentication headers and error handling.

### Custom Hooks
- `useBlogPosts` - Manages blog posts data and operations
- `useAuth` - Authentication hook with context

### Protected Routes
Route protection based on authentication status with automatic redirects.

## 🎨 Styling

The application uses Tailwind CSS with custom configurations:
- Custom color palette with primary brand colors
- Responsive design utilities
- Custom component classes for buttons, forms, etc.
- Consistent spacing and typography

## 🚧 TODO / Upcoming Features

- [ ] Rich text editor for post creation
- [ ] Image upload and management
- [ ] Real-time notifications
- [ ] Search with filters
- [ ] User dashboard with analytics
- [ ] Social media sharing
- [ ] Comment system
- [ ] User following system
- [ ] Dark mode support
- [ ] PWA capabilities
- [ ] Email notifications
- [ ] Content moderation tools

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style

The project follows these conventions:
- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Component composition over inheritance
- Separation of concerns

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you need help with setup or have questions about the integration:

1. Check the Flask backend is running on `http://localhost:5000`
2. Verify the API endpoints match the expected structure
3. Check browser console for any CORS or network errors
4. Ensure environment variables are properly set

For additional support, please create an issue in the repository.
