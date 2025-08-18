import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { PenTool, Users, BookOpen, TrendingUp, ArrowRight, Calendar, MessageCircle, Heart } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { posts, loading } = useBlogPosts(1, 6); // Get latest 6 posts for preview

  const features = [
    {
      icon: PenTool,
      title: 'Write & Publish',
      description: 'Create beautiful blog posts with our intuitive editor. Share your thoughts with the world.',
    },
    {
      icon: Users,
      title: 'Connect & Engage',
      description: 'Build your audience and engage with readers through comments and social features.',
    },
    {
      icon: BookOpen,
      title: 'Discover Content',
      description: 'Explore a wide variety of topics and discover new writers in our community.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Reach',
      description: 'Analytics and insights to help you understand your audience and grow your blog.',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Share Your Story
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              A modern blog platform where writers connect, share ideas, and build communities around their passions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        // create draft on backend then navigate
                        const draft = await (await import('../services/api')).blogAPI.createPostNew({});
                        if (draft?.id) navigate(`/post/${draft.id}/create`, { state: { newPost: true } });
                      } catch (e) {}
                    }}
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Start Writing
                  </button>
                  <Link
                    to="/dashboard"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    Your Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/posts"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
                  >
                    Browse Posts
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to blog
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From writing tools to community features, we've built everything you need to create, share, and grow your blog.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Latest Posts
              </h2>
              <p className="text-xl text-gray-600">
                Discover the newest stories from our community
              </p>
            </div>
            <Link
              to="/posts"
              className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              View all posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(0, 6).map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(post.createdAt)}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      <Link
                        to={`/post/${post.id}/view`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt || post.content.substring(0, 150) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                          {post.author.avatar ? (
                            <img
                              src={post.author.avatar}
                              alt={post.author.username}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {post.author.username[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {post.author.firstName && post.author.lastName
                            ? `${post.author.firstName} ${post.author.lastName}`
                            : post.author.username}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.commentsCount || 0}
                        </span>
                        <button className="flex items-center hover:text-red-500 transition-colors">
                          <Heart className="h-4 w-4 mr-1" />
                          0
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share your story!</p>
              {isAuthenticated && (
                <button
                  onClick={async () => {
                    try {
                      const draft = await (await import('../services/api')).blogAPI.createPostNew({});
                      if (draft?.id) navigate(`/post/${draft.id}/create`, { state: { newPost: true } });
                    } catch (e) {}
                  }}
                  className="btn-primary"
                >
                  Write your first post
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to start your blog?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of writers who are already sharing their stories and building their audience.
            </p>
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
