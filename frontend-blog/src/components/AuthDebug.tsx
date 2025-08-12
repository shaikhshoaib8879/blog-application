import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
    }}>
      <h4>Auth Debug</h4>
      <p><strong>isAuthenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
      <p><strong>isLoading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
      <p><strong>hasToken:</strong> {token ? '✅ Yes' : '❌ No'}</p>
      <p><strong>User:</strong> {user ? user.username || user.email : '❌ None'}</p>
      <p><strong>LocalStorage Token:</strong> {localStorage.getItem('authToken') ? '✅ Yes' : '❌ No'}</p>
      <p><strong>LocalStorage User:</strong> {localStorage.getItem('user') ? '✅ Yes' : '❌ No'}</p>
    </div>
  );
};

export default AuthDebug;
