import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PostsPage from './pages/PostsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import AuthError from './pages/AuthError';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import './index.css';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirect to home if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Placeholder components for future pages
const Posts: React.FC = () => <PostsPage />;

const CreatePost: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Create New Post</h1>
    <p className="text-gray-600">Rich text editor for creating posts coming soon...</p>
  </div>
);

const Profile: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">User Profile</h1>
    <p className="text-gray-600">User profile management coming soon...</p>
  </div>
);

const Dashboard: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    <p className="text-gray-600">User dashboard with analytics and post management coming soon...</p>
  </div>
);

const AppContent: React.FC = () => {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<Posts />} />
        
        {/* Auth Routes - Only accessible when not authenticated */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* OAuth Callback Route */}
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/auth/error" element={<AuthError />} />
  <Route path="/verify-email" element={<VerifyEmail />} />
  <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes - Only accessible when authenticated */}
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-6">Page not found</p>
              <a href="/" className="btn-primary">
                Go back home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
