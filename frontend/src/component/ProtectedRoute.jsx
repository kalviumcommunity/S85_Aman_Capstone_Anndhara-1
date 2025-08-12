import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../store/authStore';

export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useUser();
  
  // Wait for loading to complete before making redirect decisions
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
    </div>;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const FarmerRoute = ({ children }) => {
  const { isLoggedIn, isFarmer, hasRole, loading } = useUser();
  
  // Wait for loading to complete before making redirect decisions
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
    </div>;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasRole) {
    return <Navigate to="/profile" replace />;
  }
  
  if (!isFarmer) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};
