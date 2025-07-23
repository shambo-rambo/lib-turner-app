/**
 * AdminDashboard Component
 * Main dashboard for admin users with book management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  PhotoIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { searchBooks, getEffectiveCoverUrl } from '../../services/books.js';
import { loadBooksWithCustomCovers } from '../../services/bookLoader.js';
import { signOutUser, getCurrentUser } from '../../services/auth.js';
import BookCoverUpload from '../../components/admin/BookCoverUpload.jsx';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser && currentUser.school_id) {
          // Use the enhanced book loader that includes custom covers
          const allBooks = await loadBooksWithCustomCovers(currentUser.school_id);
          setBooks(allBooks);
          setFilteredBooks(allBooks);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredBooks(books);
      return;
    }

    const filtered = books.filter(book =>
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBooks(filtered);
  }, [searchTerm, books]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCoverUpdated = async (bookId, newCoverUrl) => {
    // Update the local state immediately for quick feedback
    setBooks(prevBooks =>
      prevBooks.map(book =>
        book.id === bookId
          ? {
              ...book,
              metadata: {
                ...book.metadata,
                custom_cover_url: newCoverUrl,
                cover_source: newCoverUrl ? 'custom' : 'api'
              },
              effectiveCoverUrl: newCoverUrl || book.metadata?.cover_url
            }
          : book
      )
    );

    // Also refresh from database to ensure consistency
    try {
      if (user && user.school_id) {
        const refreshedBooks = await loadBooksWithCustomCovers(user.school_id);
        setBooks(refreshedBooks);
        setFilteredBooks(refreshedBooks.filter(book =>
          !searchTerm ||
          book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      }
    } catch (error) {
      console.error('Error refreshing books after cover update:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white mr-8">LibFlix Admin</h1>
              <nav className="flex space-x-4">
                <button className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium">
                  Books
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-300 text-sm">
                <UserIcon className="h-4 w-4 mr-2" />
                {user?.name || user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-300 p-2 rounded-md transition-colors"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Book Management</h2>
          <p className="text-gray-300">
            Manage book covers and metadata for your library
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Books ({filteredBooks.length})
            </h3>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'No books found matching your search.' : 'No books available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cover
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Book Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cover Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredBooks.map((book) => {
                    const coverUrl = getEffectiveCoverUrl(book);
                    const hasCustomCover = book.metadata?.cover_source === 'custom';
                    
                    return (
                      <tr key={book.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={`${book.title} cover`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-300">
                              by {book.author}
                            </div>
                            {book.isbn && (
                              <div className="text-xs text-gray-400 mt-1">
                                ISBN: {book.isbn}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            hasCustomCover
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {hasCustomCover ? 'Custom' : 'API'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <BookCoverUpload
                            book={book}
                            onCoverUpdated={handleCoverUpdated}
                            trigger={
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center">
                                <PhotoIcon className="h-4 w-4 mr-1" />
                                Update Cover
                              </button>
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;