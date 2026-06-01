import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SAEPage from './pages/SAEPage';
import STAPage from './pages/STAPage';
import STEPage from './pages/STEPage';
import VisitorsPage from './pages/VisitorsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4" />
        <p className="text-emerald-700 font-medium">Loading system...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
        <Route path="sae" element={<ErrorBoundary><SAEPage /></ErrorBoundary>} />
        <Route path="sta" element={<ErrorBoundary><STAPage /></ErrorBoundary>} />
        <Route path="ste" element={<ErrorBoundary><STEPage /></ErrorBoundary>} />
        <Route path="visitors" element={<ErrorBoundary><VisitorsPage /></ErrorBoundary>} />
        <Route path="reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
        <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
        <Route path="users" element={<AdminRoute><ErrorBoundary><UsersPage /></ErrorBoundary></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Outfit, sans-serif', borderRadius: '12px', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' }, style: { borderLeft: '4px solid #059669' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' }, style: { borderLeft: '4px solid #dc2626' } },
            loading: { iconTheme: { primary: '#d97706', secondary: '#fff' }, style: { borderLeft: '4px solid #d97706' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
