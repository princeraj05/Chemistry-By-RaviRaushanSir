import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect admin users trying to access student-facing pages
  if (!adminOnly && user?.role?.toLowerCase() === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
