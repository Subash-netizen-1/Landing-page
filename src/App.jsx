import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Attendees from './pages/Attendees';
import CheckIn from './pages/CheckIn';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Layout & Protected Route Component
import ProtectedLayout from './components/layout/ProtectedLayout';

// Route access guard based on roles
const RoleGuard = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-200 dark:border-gray-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Simple Unauthorized placeholder page
const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
    <div className="p-4 bg-red-100 rounded-full dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
    <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
      You do not have permission to view this page. If you believe this is an error, please contact your administrator.
    </p>
    <a href="/" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors duration-200">
      Back to Dashboard
    </a>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected System Routes */}
            <Route path="/" element={
              <RoleGuard>
                <ProtectedLayout />
              </RoleGuard>
            }>
              {/* Dashboard is visible to all roles */}
              <Route index element={<Dashboard />} />
              
              {/* Events: Viewable by all, write guards are handled in components */}
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetails />} />
              
              {/* Attendees: Registered / Edited by all roles, delete guarded */}
              <Route path="attendees" element={<Attendees />} />
              
              {/* Check-In: Staff, Managers, Admins */}
              <Route path="check-in" element={<CheckIn />} />
              
              {/* Payments: Viewable by all, refund only by Admin/Manager */}
              <Route path="payments" element={<Payments />} />
              
              {/* Reports: restricted to Super Admin and Event Manager */}
              <Route path="reports" element={
                <RoleGuard allowedRoles={['Super Admin', 'Event Manager']}>
                  <Reports />
                </RoleGuard>
              } />
              
              {/* Settings: Org portion guarded to Super Admin, Profile open to all */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        
        {/* Toast notifications handler */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
            style: {
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif'
            }
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
