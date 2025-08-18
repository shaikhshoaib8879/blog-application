import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { BlogPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye, 
  Clock,
  Share2,
  Heart,
  MessageCircle,
  Edit3,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const PostDetail: React.FC = () => {
  const { postId, mode } = useParams<{ postId: string; mode: 'published' | 'view' }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Support preview on /post/:id/published and new /post/:id/published/view and alias /publsih
  const path = window.location.pathname;
  const isPreviewMode = (mode === 'published') || path.endsWith('/published') || path.endsWith('/published/view') || path.endsWith('/publsih');
  const isPublicView = mode === 'view';

  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (postId && loadedRef.current !== `${postId}:${isPreviewMode}`) {
      loadedRef.current = `${postId}:${isPreviewMode}`;
      fetchPost(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, isPreviewMode]);

  const fetchPost = async (id: string) => {
    try {
      setLoading(true);
  const response = await blogAPI.getPostById(id);
  const postData = response;
      
      // Check permissions based on mode
      if (isPreviewMode) {
        // Preview mode: only author can access
        if (!isAuthenticated || postData.author.id !== user?.id) {
          setError('You can only preview your own posts');
          return;
        }
      } else if (isPublicView) {
        // Public view: only published posts, and not by author
        if (!postData.published) {
          setError('This post is not published');
          return;
        }
        if (isAuthenticated && postData.author.id === user?.id) {
          // Redirect author to preview mode
          navigate(`/post/${id}/published/view`);
          return;
        }
      }
      
      setPost(postData);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post');
      }
      // Avoid noisy toast on navigation errors
    } finally {
      setLoading(false);
    }
  };

  const renderEditorJsContent = (content: string) => {
    try {
      const data = JSON.parse(content);
      return data.blocks?.map((block: any, index: number) => {
        switch (block.type) {
          case 'header':
            const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
            return (
              <HeaderTag
                key={index}
                className={`font-bold mb-4 ${
                  block.data.level === 1 ? 'text-4xl' :
                  block.data.level === 2 ? 'text-3xl' :
                  block.data.level === 3 ? 'text-2xl' :
                  block.data.level === 4 ? 'text-xl' :
                  'text-lg'
                }`}
              >
                {block.data.text}
              </HeaderTag>
            );
          
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-lg leading-relaxed text-gray-800">
                {block.data.text}
              </p>
            );
          
          case 'list':
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={`mb-4 ml-6 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
                {block.data.items.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className="mb-2 text-lg text-gray-800">
                    {item}
                  </li>
                ))}
              </ListTag>
            );
          
          case 'code':
            return (
              <pre key={index} className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                <code className="text-sm font-mono">{block.data.code}</code>
              </pre>
            );
          
          case 'quote':
            return (
              <blockquote key={index} className="border-l-4 border-gray-300 pl-6 py-2 mb-4 italic text-xl text-gray-700 bg-gray-50">
                <p>{block.data.text}</p>
                {block.data.caption && (
                  <cite className="block mt-2 text-sm text-gray-600 not-italic">
                    — {block.data.caption}
                  </cite>
                )}
              </blockquote>
            );
          
          case 'image':
            return (
              <figure key={index} className="mb-6 text-center">
                <img
                  src={transformCloudinary(block.data.file.url, 'content')}
                  alt={block.data.caption || ''}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                />
                {block.data.caption && (
                  <figcaption className="text-sm text-gray-600 mt-2 italic">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );
          
          case 'embed':
            return (
              <div key={index} className="mb-6">
                <iframe
                  src={block.data.embed}
                  title={block.data.caption || `Embed ${index}`}
                  className="w-full h-64 rounded-lg"
                  frameBorder="0"
                  allowFullScreen
                />
                {block.data.caption && (
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    {block.data.caption}
                  </p>
                )}
              </div>
            );
          
          case 'delimiter':
            return (
              <div key={index} className="text-center my-8">
                <span className="text-2xl text-gray-400">***</span>
              </div>
            );
          
          default:
            return null;
        }
      });
    } catch (e) {
      // Fallback to plain text if JSON parsing fails
      return <p className="text-lg leading-relaxed text-gray-800">{content}</p>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const textLength = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.ceil(textLength / wordsPerMinute);
    return readTime;
  };

  // Cloudinary URL transformer: injects transforms after `/upload/` when using Cloudinary URLs
  const transformCloudinary = (url: string, kind: 'featured' | 'content' = 'content') => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    const marker = '/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const after = url.slice(idx + marker.length);
    // If a transformation already exists (not starting with version 'v'), skip modifying
    if (after && after[0] !== 'v') return url;

    // Choose sensible defaults
    const base = ['f_auto', 'q_auto'];
    if (kind === 'featured') {
      base.push('c_fill', 'w_1600', 'h_900');
    } else {
      // content
      base.push('c_limit', 'w_1200');
    }

    const transform = base.join(',');
    return url.slice(0, idx + marker.length) + transform + '/' + after;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {error?.includes('not found') ? '404' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">{error || 'Post not found'}</p>
          <Link
            to={isPreviewMode ? "/dashboard" : "/posts"}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{isPreviewMode ? 'Back to Dashboard' : 'Back to Posts'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium">Preview Mode</p>
                <p className="text-blue-600 text-sm">This is how your post will appear when published</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/edit/${post?.id}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit3 size={16} />
                <span>Edit Post</span>
              </Link>
            </div>
          </div>
        )}

        {/* Back Navigation */}
        <Link
          to={isPreviewMode ? "/dashboard" : "/posts"}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{isPreviewMode ? 'Back to Dashboard' : 'Back to Posts'}</span>
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden">
              <img
                src={transformCloudinary(post.featuredImage, 'featured')}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8 lg:p-12">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{post.author.firstName ? `${post.author.firstName} ${post.author.lastName}` : post.author.username}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>{calculateReadTime(post.content)} min read</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Eye size={16} />
                    <span>{post.views || 0} views</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <Heart size={16} />
                    <span>Like</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {renderEditorJsContent(post.content)}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Tags:</span>
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Comments Section (Placeholder) */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mt-8">
          <div className="flex items-center space-x-2 mb-6">
            <MessageCircle size={20} className="text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Comments</h3>
          </div>
          
          <div className="text-center py-12 text-gray-600">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p>Comments feature coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
