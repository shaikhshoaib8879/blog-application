import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">BlogApp</span>
            </div>
            <p className="mt-4 text-gray-600 text-sm">
              A modern blog platform built with React and Flask. Share your thoughts, 
              connect with others, and build your audience.
            </p>
            <div className="mt-6 flex space-x-4">
              <a
                href="https://github.com"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@blogapp.com"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="mt-4 space-y-2">
              <Link to="/" className="block text-sm text-gray-600 hover:text-primary-600">
                Home
              </Link>
              <Link to="/posts" className="block text-sm text-gray-600 hover:text-primary-600">
                Browse Posts
              </Link>
              <Link to="/about" className="block text-sm text-gray-600 hover:text-primary-600">
                About
              </Link>
              <Link to="/contact" className="block text-sm text-gray-600 hover:text-primary-600">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Legal
            </h3>
            <div className="mt-4 space-y-2">
              <Link to="/privacy" className="block text-sm text-gray-600 hover:text-primary-600">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-sm text-gray-600 hover:text-primary-600">
                Terms of Service
              </Link>
              <Link to="/cookies" className="block text-sm text-gray-600 hover:text-primary-600">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} BlogApp. All rights reserved.
            </p>
            <p className="flex items-center text-sm text-gray-600 mt-2 md:mt-0">
              Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> for bloggers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
