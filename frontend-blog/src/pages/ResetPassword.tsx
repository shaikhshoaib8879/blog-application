import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successful');
      navigate('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        <form onSubmit={submit} className="space-y-4">
          <input className="form-input w-full" type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
          <input className="form-input w-full" type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <button type="submit" className="btn-primary w-full">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
