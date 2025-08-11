import { useState, useEffect } from 'react';
import { blogAPI } from '../services/api';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  published: boolean;
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  commentsCount?: number;
}

interface UseBlogPostsResult {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  fetchPosts: (page?: number) => Promise<void>;
  createPost: (postData: any) => Promise<BlogPost | null>;
  updatePost: (id: string, postData: any) => Promise<BlogPost | null>;
  deletePost: (id: string) => Promise<boolean>;
  searchPosts: (query: string) => Promise<void>;
}

export const useBlogPosts = (initialPage = 1, limit = 10): UseBlogPostsResult => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchPosts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogAPI.getAllPosts(page, limit);
      setPosts(response.posts || response.data || []);
      setTotalPages(response.totalPages || Math.ceil(response.total / limit) || 1);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch posts');
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: any): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      const newPost = await blogAPI.createPost(postData);
      setPosts((prev) => [newPost, ...prev]);
      toast.success('Post created successfully!');
      return newPost;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
      toast.error('Failed to create post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, postData: any): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      const updatedPost = await blogAPI.updatePost(id, postData);
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? updatedPost : post))
      );
      toast.success('Post updated successfully!');
      return updatedPost;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update post');
      toast.error('Failed to update post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await blogAPI.deletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      toast.success('Post deleted successfully!');
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete post');
      toast.error('Failed to delete post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogAPI.searchPosts(query);
      setPosts(response.posts || response.data || []);
      setTotalPages(1); // Reset pagination for search results
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search posts');
      toast.error('Failed to search posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    totalPages,
    currentPage,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    searchPosts,
  };
};

interface UseSinglePostResult {
  post: BlogPost | null;
  loading: boolean;
  error: string | null;
  fetchPost: () => Promise<void>;
}

export const useSinglePost = (postId: string): UseSinglePostResult => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await blogAPI.getPostById(postId);
      setPost(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch post');
      toast.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  return {
    post,
    loading,
    error,
    fetchPost,
  };
};
