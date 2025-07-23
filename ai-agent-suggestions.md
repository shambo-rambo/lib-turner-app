/**
 * DEBUG VERSION: Use this to troubleshoot edit button issues
 * Add console logs to see what's happening
 */

// Add this debug version of your edit button area:
{/* DEBUG: Admin Status Check */}
{console.log('Admin check:', { isAdmin, isHovered, userType: user?.user_type, permissions: user?.permissions })}

{/* Admin Edit Button - DEBUG VERSION */}
{isAdmin ? (
  <div>
    {console.log('Admin is true, showing edit button')}
    <button
      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-3 shadow-lg z-50"
      onClick={(e) => {
        console.log('🔥 EDIT BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        setShowUploadModal(true);
      }}
      onMouseDown={(e) => {
        console.log('Edit button mouse down');
        e.stopPropagation();
      }}
      data-admin-button="true"
      title="Edit book cover - DEBUG"
      style={{
        minWidth: '50px',
        minHeight: '50px',
        display: 'flex !important',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute !important',
        zIndex: '50 !important',
        backgroundColor: 'red !important' // Make it obvious
      }}
    >
      <PencilIcon className="w-6 h-6" />
      ✏️
    </button>
  </div>
) : (
  <div>
    {console.log('Admin is false:', { isAdmin, user })}
  </div>
)}

{/* DEBUG: Modal State */}
{console.log('Modal state:', { showUploadModal })}

{/* DEBUG: Upload Modal */}
{showUploadModal && (
  <div>
    {console.log('🚀 MODAL SHOULD BE SHOWING')}
    <div 
      className="fixed inset-0 bg-red-500 bg-opacity-50 z-[9999] flex items-center justify-center"
      onClick={() => {
        console.log('Modal backdrop clicked');
        setShowUploadModal(false);
      }}
    >
      <div 
        className="bg-white p-8 rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>DEBUG: Modal is working!</h2>
        <p>Book: {book.title}</p>
        <button 
          onClick={() => setShowUploadModal(false)}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Close Debug Modal
        </button>
        
        {/* Your actual BookCoverUpload component */}
        <BookCoverUpload
          book={book}
          onClose={() => setShowUploadModal(false)}
          onCoverUpdated={onCoverUpdated}
        />
      </div>
    </div>
  </div>
)}

// DEBUG: Add this to check admin status
useEffect(() => {
  console.log('🔍 Current user state:', {
    user,
    isAdmin,
    userType: user?.user_type,
    permissions: user?.permissions
  });
}, [user, isAdmin]);

// DEBUG: Add this to check hover state
useEffect(() => {
  console.log('🖱️ Hover state changed:', { isHovered });
}, [isHovered]);