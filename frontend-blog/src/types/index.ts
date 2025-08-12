// Global type definitions for the blog application

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator';
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  published: boolean;
  tags: string[];
  author: User;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
  readTime?: number;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string; // for nested comments
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  replies?: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postsCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postsCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  tags?: string[];
  category?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  published?: boolean;
  featuredImage?: string;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentId?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
}
