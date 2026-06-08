import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/student/Dashboard';
import Courses from './pages/student/Courses';
import CourseDetail from './pages/student/CourseDetail';
import VideoWatch from './pages/student/VideoWatch';
import Profile from './pages/student/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminVideos from './pages/admin/AdminVideos';
import AdminStudents from './pages/admin/AdminStudents';
import AdminPayments from './pages/admin/AdminPayments';

function App() {
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Navigation bar is automatically displayed for logged-in sessions */}
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            {/* Auth Gate */}
            <Route 
              path="/login" 
              element={!token ? <Login /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? "/admin/dashboard" : "/dashboard"} replace />} 
            />
            
            {/* Student Protected Routes */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/courses" 
              element={<ProtectedRoute><Courses /></ProtectedRoute>} 
            />
            <Route 
              path="/courses/:id" 
              element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} 
            />
            <Route 
              path="/courses/:courseId/watch/:videoId" 
              element={<ProtectedRoute><VideoWatch /></ProtectedRoute>} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute><Profile /></ProtectedRoute>} 
            />
            
            {/* Admin Protected Routes */}
            <Route 
              path="/admin/dashboard" 
              element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/courses" 
              element={<ProtectedRoute adminOnly={true}><AdminCourses /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/videos" 
              element={<ProtectedRoute adminOnly={true}><AdminVideos /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/students" 
              element={<ProtectedRoute adminOnly={true}><AdminStudents /></ProtectedRoute>} 
            />
            <Route 
              path="/admin/payments" 
              element={<ProtectedRoute adminOnly={true}><AdminPayments /></ProtectedRoute>} 
            />
            
            {/* Fallback Redirection */}
            <Route 
              path="*" 
              element={<Navigate to={token ? (user?.role?.toLowerCase() === 'admin' ? "/admin/dashboard" : "/dashboard") : "/login"} replace />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
