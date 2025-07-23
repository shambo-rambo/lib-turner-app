/**
 * ProtectedRoute Component
 * Ensures only authenticated admin users can access admin routes
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth.js';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser && currentUser.user_type === 'admin') {
          if (requiredPermission) {
            setHasPermission(currentUser.permissions?.[requiredPermission] === true);
          } else {
            setHasPermission(true);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredPermission]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.user_type !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredPermission && !hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">
            You don't have permission to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;