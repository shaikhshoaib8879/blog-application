import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },
  
  // SSO Authentication
  googleAuth: async (token: string) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },
  
  githubAuth: async (code: string) => {
    const response = await api.post('/auth/github', { code });
    return response.data;
  },
};

// Blog posts API calls
export const blogAPI = {
  getAllPosts: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getPostById: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
  
  createPost: async (postData: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    published?: boolean;
  }) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  
  updatePost: async (id: string, postData: any) => {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },
  
  deletePost: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },
  
  getPostsByUser: async (userId: string) => {
    const response = await api.get(`/users/${userId}/posts`);
    return response.data;
  },
  
  searchPosts: async (query: string) => {
    const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Comments API calls
export const commentsAPI = {
  getCommentsByPost: async (postId: string) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },
  
  createComment: async (postId: string, content: string) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },
  
  updateComment: async (commentId: string, content: string) => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },
  
  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};

// User profile API calls
export const userAPI = {
  getUserProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  
  updateProfile: async (userData: any) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
