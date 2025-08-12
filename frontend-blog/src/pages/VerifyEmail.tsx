import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const status = params.get('status');
  const title = status === 'success' ? 'Email verified!' : 'Verification failed';
  const message = status === 'success' ?
    'Your email has been verified. You can now sign in.' :
    'The verification link is invalid or has expired. Please request a new one.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link to="/login" className="btn-primary w-full inline-block text-center">Go to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
