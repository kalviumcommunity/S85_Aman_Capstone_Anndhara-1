import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../store/authStore';

export const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useUser();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const FarmerRoute = ({ children }) => {
  const { isLoggedIn, isFarmer, hasRole } = useUser();
  
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
