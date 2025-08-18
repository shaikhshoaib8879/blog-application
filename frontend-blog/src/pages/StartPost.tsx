import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import toast from 'react-hot-toast';

// Creates a blank draft then redirects to /post/:id for editing
const StartPost: React.FC = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
  if (startedRef.current) return; // prevent double-run in dev
  startedRef.current = true;
  const go = async () => {
      try {
        setCreating(true);
        const emptyEditor = {
          time: Date.now(),
          blocks: [
            { type: 'paragraph', data: { text: '' } }
          ],
          version: '2.30.8'
        };
  const draft = await blogAPI.createPostNew({
          title: 'Untitled',
          content: JSON.stringify(emptyEditor),
          excerpt: '',
          published: false,
        });
        if (draft?.id) {
          navigate(`/post/${draft.id}/create`, { state: { newPost: true } });
        } else {
          throw new Error('Draft create response missing id');
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.error || 'Failed to start a new post');
        navigate('/dashboard');
      } finally {
        setCreating(false);
      }
    };
    go();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-gray-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
        <p>Creating your draft…</p>
      </div>
    </div>
  );
};

export default StartPost;
