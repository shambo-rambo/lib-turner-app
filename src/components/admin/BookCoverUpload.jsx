/**
 * BookCoverUpload Component
 * Allows admin users to upload custom book covers
 */

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import { PhotoIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { validateImageFile, getPreviewUrl, cleanupPreviewUrl } from '../../services/imageUpload.js';
import { updateBookCover, revertBookCover, getEffectiveCoverUrl } from '../../services/books.js';
import { getCurrentUser } from '../../services/auth.js';

const BookCoverUpload = ({ book, onCoverUpdated, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError('');
    setSelectedFile(file);
    
    if (previewUrl) {
      cleanupPreviewUrl(previewUrl);
    }
    
    const newPreviewUrl = getPreviewUrl(file);
    setPreviewUrl(newPreviewUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const user = await getCurrentUser();
      const newCoverUrl = await updateBookCover(book.id, selectedFile, user.uid);
      
      setSuccess('Cover uploaded successfully!');
      onCoverUpdated?.(book.id, newCoverUrl);
      
      setTimeout(() => {
        setIsOpen(false);
        handleClose();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRevert = async () => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const user = await getCurrentUser();
      await revertBookCover(book.id, user.uid);
      
      setSuccess('Reverted to original cover!');
      onCoverUpdated?.(book.id, book.metadata?.cover_url || '');
      
      setTimeout(() => {
        setIsOpen(false);
        handleClose();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
    if (previewUrl) {
      cleanupPreviewUrl(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentCoverUrl = getEffectiveCoverUrl(book);
  const hasCustomCover = book.metadata?.cover_source === 'custom';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) handleClose();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent 
        className="fixed inset-0 z-50 bg-black/50"
        aria-describedby="dialog-description"
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-white">
                Update Book Cover
              </DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p id="dialog-description" className="text-gray-300 mt-2">
              {book.title} by {book.author}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg flex items-center">
                <CheckIcon className="h-5 w-5 mr-2" />
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Current Cover</h3>
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                  {currentCoverUrl ? (
                    <img
                      src={currentCoverUrl}
                      alt={`${book.title} cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>No cover available</p>
                    </div>
                  )}
                </div>
                {hasCustomCover && (
                  <p className="text-xs text-blue-400 mt-2">Custom uploaded cover</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">New Cover</h3>
                <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-600">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="text-gray-400 text-center cursor-pointer hover:text-gray-300 transition-colors w-full h-full flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <PhotoIcon className="h-12 w-12 mb-2" />
                      <p className="text-sm">Click to select image</p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Select New Image
              </button>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Upload Cover
                    </>
                  )}
                </button>
              )}

              {hasCustomCover && (
                <button
                  onClick={handleRevert}
                  disabled={uploading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Reverting...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      Revert to Original
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookCoverUpload;