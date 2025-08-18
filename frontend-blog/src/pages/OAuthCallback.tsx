import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthFromToken } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const userEncoded = searchParams.get('user');
      const error = searchParams.get('message');

      if (error) {
        toast.error(`OAuth error: ${error}`);
        navigate('/login');
        return;
      }
      
      if (token && userEncoded) {
        try {
          // Decode user data from URL
          const userDataString = atob(userEncoded);
          const user = JSON.parse(userDataString);
          
          // Set auth state
          setAuthFromToken(token, user);

          toast.success(`Successfully logged in with ${provider}!`);
          navigate('/');
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Authentication failed');
          navigate('/login');
        }
      } else {
        toast.error('Authentication data missing');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuthFromToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
