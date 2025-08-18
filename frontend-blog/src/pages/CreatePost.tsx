import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Code from '@editorjs/code';
// @ts-ignore
import LinkTool from '@editorjs/link';
// @ts-ignore
import Image from '@editorjs/image';
// @ts-ignore
import Embed from '@editorjs/embed';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Marker from '@editorjs/marker';
// @ts-ignore
import InlineCode from '@editorjs/inline-code';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';
// @ts-ignore
import Underline from '@editorjs/underline';
import { blogAPI } from '../services/api';
import { Save, Eye, ArrowLeft, Upload, Hash, Settings } from 'lucide-react';

const CreatePost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [featuredImage, setFeaturedImage] = useState('');
  
  const editorRef = useRef<EditorJS | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isNewFromRedirect = (location.state as any)?.newPost === true;
  const isEditMode = !!postId;

  // Load existing post if in edit mode
  useEffect(() => {
    if (isEditMode && postId && !isNewFromRedirect) {
      loadExistingPost(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, postId, isNewFromRedirect]);

  const loadExistingPost = async (id: string) => {
    try {
      setIsLoading(true);
  const response = await blogAPI.getPostById(id);
  const post = response;
      
      setTitle(post.title);
      setExcerpt(post.excerpt || '');
      setTags(post.tags || []);
      setFeaturedImage(post.featuredImage || '');
      
      // Parse and load content into editor
      if (post.content) {
        const contentData = JSON.parse(post.content);
        if (editorRef.current) {
          await editorRef.current.render(contentData);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load post for editing');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Editor.js
  const CLOUDINARY_CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const CLOUDINARY_FOLDER = process.env.REACT_APP_CLOUDINARY_FOLDER || 'blog-media';

  const initialBlocks = isNewFromRedirect
      ? []
      : [
          {
            type: "paragraph",
            data: {
              text: "Start writing your amazing story..."
            }
          }
        ];

  editorRef.current = new EditorJS({
      holder: 'editorjs',
      tools: {
        // @ts-ignore
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          },
          inlineToolbar: ['bold', 'italic', 'underline', 'link']
        },
        // @ts-ignore
        paragraph: {
          class: Paragraph,
          config: {
            placeholder: 'Let\'s write an awesome story!',
          },
          inlineToolbar: ['bold', 'italic', 'underline', 'link', 'marker', 'inlineCode']
        },
        // @ts-ignore
        list: {
          class: List,
          config: {
            defaultStyle: 'unordered'
          },
          inlineToolbar: true
        },
        // @ts-ignore
        code: {
          class: Code,
          config: {
            placeholder: 'Enter code here...'
          }
        },
        // @ts-ignore
        linkTool: {
          class: LinkTool,
          config: {
            endpoint: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/media/fetch-url`
          }
        },
        // @ts-ignore
        image: {
          class: Image,
          config: CLOUDINARY_CLOUD && CLOUDINARY_PRESET
            ? {
                uploader: {
                  uploadByFile: async (file: File) => {
                    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('upload_preset', CLOUDINARY_PRESET);
                    if (CLOUDINARY_FOLDER) fd.append('folder', CLOUDINARY_FOLDER);
                    const res = await fetch(url, { method: 'POST', body: fd });
                    const data = await res.json();
                    if (!res.ok || !data.secure_url) throw new Error(data.error?.message || 'Upload failed');
                    return { success: 1, file: { url: data.secure_url, width: data.width, height: data.height } };
                  },
                  uploadByUrl: async (src: string) => {
                    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
                    const fd = new FormData();
                    fd.append('file', src);
                    fd.append('upload_preset', CLOUDINARY_PRESET);
                    if (CLOUDINARY_FOLDER) fd.append('folder', CLOUDINARY_FOLDER);
                    const res = await fetch(url, { method: 'POST', body: fd });
                    const data = await res.json();
                    if (!res.ok || !data.secure_url) throw new Error(data.error?.message || 'Upload failed');
                    return { success: 1, file: { url: data.secure_url, width: data.width, height: data.height } };
                  }
                }
              }
            : {
                endpoints: {
                  byFile: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/media/upload`,
                  byUrl: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/media/upload-by-url`
                },
                additionalRequestHeaders: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
              }
        },
        // @ts-ignore
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              codesandbox: true,
              codepen: true,
              github: true,
              twitter: true,
              instagram: true
            }
          }
        },
        // @ts-ignore
        quote: {
          class: Quote,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author',
          },
          inlineToolbar: true,
        },
        // @ts-ignore
        marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M',
        },
        // @ts-ignore
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+M',
        },
        // @ts-ignore
  delimiter: Delimiter,
  // @ts-ignore
  underline: Underline,
      },
  data: { blocks: initialBlocks },
      onChange: () => {
        // Auto-save functionality can be added here
      },
      placeholder: 'Let\'s write an awesome story!',
    });

    // Attach hover delete buttons for each block
    const holderEl = document.getElementById('editorjs');
    let observer: MutationObserver | null = null;

    const attachDeleteButtons = () => {
      if (!holderEl) return;
      const blocks = holderEl.querySelectorAll('.ce-block');
      blocks.forEach((block) => {
        if ((block as HTMLElement).querySelector('.block-delete-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'block-delete-btn';
        btn.type = 'button';
        btn.title = 'Delete section';
        btn.innerText = '×';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!editorRef.current) return;
          // Determine index of this block
          const allBlocks = Array.from(holderEl.querySelectorAll('.ce-block'));
          const index = allBlocks.indexOf(block);
          if (index >= 0) {
            // @ts-ignore
            editorRef.current.blocks.delete(index);
          }
        });
        (block as HTMLElement).style.position = 'relative';
        (block as HTMLElement).appendChild(btn);
      });
    };

    // Initial attach after a short delay to allow editor to render
    const initialTimer = window.setTimeout(attachDeleteButtons, 300);

    // Observe changes to re-attach buttons for new/removed blocks
    if (holderEl) {
      observer = new MutationObserver(() => attachDeleteButtons());
      observer.observe(holderEl, { childList: true, subtree: true });
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      if (observer) observer.disconnect();
      window.clearTimeout(initialTimer);
    };
  }, []);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const savedData = await editorRef.current?.save();
      
      const postData = {
        title: title.trim(),
        content: JSON.stringify(savedData),
        excerpt: excerpt.trim() || undefined,
        published: publish,
        featuredImage: featuredImage || undefined,
        // Note: tags are not currently supported by the backend
      } as any;

      console.log('Sending post data:', postData); // Debug log
      
  let response: any;
      if (isEditMode && postId) {
        // Use alias endpoint as requested
        response = await blogAPI.updatePostAlias(postId, postData);
        toast.success(publish ? 'Post updated and published!' : 'Post updated!');
      } else {
        response = await blogAPI.createPostNew(postData);
        toast.success(publish ? 'Post published successfully!' : 'Post saved as draft!');
      }
      
  const savedPost = response; // API returns parsed data directly
      
      if (publish) {
        // Redirect to preview mode
  navigate(`/post/${savedPost.id}/published/view`);
      } else {
        navigate('/dashboard');
      }
      
    } catch (error: any) {
      console.error('Save error:', error); // Debug log
      console.error('Error response:', error.response?.data); // Debug log
      toast.error(error.response?.data?.message || error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'save'} post`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title to preview');
      return;
    }
    
    try {
      await editorRef.current?.save();
      // You can implement a preview modal or route here
      toast('Preview functionality coming soon!', { icon: 'ℹ️' });
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Loading State for Edit Mode */}
      {isLoading && isEditMode && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading post for editing...</p>
          </div>
        </div>
      )}

      {/* Header */}
  <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isNewFromRedirect ? 'Write your story' : (isEditMode ? 'Edit your story' : 'Write your story')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePreview}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center space-x-1 px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save draft'}</span>
            </button>
            
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center space-x-1 px-4 py-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <span>{isSaving ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update' : 'Publish')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Post Settings</h3>
            
            {/* Featured Image */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Upload size={16} />
                </button>
              </div>
            </div>

            {/* Excerpt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (Optional)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write a brief description of your post..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tags (press Enter to add)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    <Hash size={10} className="mr-1" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="mb-8">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none bg-transparent"
            placeholder="Title"
            rows={1}
            style={{
              minHeight: '1.2em',
              overflow: 'hidden',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>

        {/* Editor */}
        <div className="prose prose-lg max-w-none">
          <div id="editorjs" className="min-h-[500px] pt-2"></div>
        </div>
      </div>

      {/* Mobile Save Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
