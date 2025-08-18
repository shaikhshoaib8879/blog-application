import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BlogPost } from '../types';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  Calendar, 
  BookOpen,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstLoadRef = useRef(false);

  const fetchUserPosts = useCallback(async () => {
    // {debugger}
    try {
      if (user?.id) {
        // {debugger}
        console.log('Fetching posts for user:', user.id);
        const response = await blogAPI.getPostsByUser(user.id.toString());
        setPosts(response.data || []);
        
        // Calculate stats
        const totalPosts = response.data?.length || 0;
        const publishedPosts = response.data?.filter((post: BlogPost) => post.published).length || 0;
        const draftPosts = totalPosts - publishedPosts;
        const totalViews = response.data?.reduce((sum: number, post: BlogPost) => sum + (post.views || 0), 0) || 0;
        
        setStats({
          totalPosts,
          publishedPosts,
          draftPosts,
          totalViews,
        });
      }
    } catch (error: any) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!firstLoadRef.current) {
      firstLoadRef.current = true;
      fetchUserPosts();
    }
  }, [fetchUserPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await blogAPI.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.firstName || user?.username}! Here's your writing overview.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const draft = await blogAPI.createPostNew({});
                  if (draft?.id) {
                    navigate(`/post/${draft.id}/create`, { state: { newPost: true } });
                  }
                } catch (error) {
                  toast.error('Failed to create new post');
                }
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Write New Post</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={<BookOpen size={24} className="text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Published"
            value={stats.publishedPosts}
            icon={<Eye size={24} className="text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Drafts"
            value={stats.draftPosts}
            icon={<Edit3 size={24} className="text-white" />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews}
            icon={<TrendingUp size={24} className="text-white" />}
            color="bg-purple-500"
          />
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Posts</h2>
          </div>
          
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">
                Start writing your first blog post to see it appear here.
              </p>
              <button
                onClick={async () => {
                  try {
                    const draft = await blogAPI.createPostNew({});
                    if (draft?.id) {
                      navigate(`/post/${draft.id}/create`, { state: { newPost: true } });
                    }
                  } catch (error) {
                    toast.error('Failed to create new post');
                  }
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create Your First Post</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <h3 className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 truncate max-w-xs mt-1">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Eye size={16} className="text-gray-400" />
                          <span>{post.views || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/post/${post.id}/published/view`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Preview post"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/post/${post.id}/create`}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit post"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete post"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
