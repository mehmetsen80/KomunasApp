import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout shells
import AuthenticatedLayout from '../components/AuthenticatedLayout';

// Public pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import FormDetail from '../pages/FormDetail';
import NewsroomAlertsIntel from '../pages/NewsroomAlertsIntel';
import NewsReleasesIntel from '../pages/NewsReleasesIntel';
import PolicyManualIntel from '../pages/PolicyManualIntel';
import VisaBulletinIntel from '../pages/VisaBulletinIntel';
import ProcessingTimesIntel from '../pages/ProcessingTimesIntel';

// Authenticated pages
import Overview from '../pages/Dashboard';
import ChangeMonitor from '../pages/ChangeMonitor';
import Sources from '../pages/Sources';
import Documents from '../pages/Documents';
import Alerts from '../pages/Notifications';
import Reports from '../pages/Reports';
import SavedSearches from '../pages/SavedSearches';
import Team from '../pages/Team';
import AIAgents from '../pages/AIAgents';
import Profile from '../pages/Profile';

// Smart root redirect
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/overview" replace /> : <Home />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ── Root ── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Public (no auth required) ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public intelligence pages (accessible without login) */}
      {!isAuthenticated && (
        <>
          <Route path="/form/:id" element={<FormDetail />} />
          <Route path="/newsroom/newsroom-alerts" element={<NewsroomAlertsIntel />} />
          <Route path="/newsroom/news-releases" element={<NewsReleasesIntel />} />
          <Route path="/newsroom/policy-updates" element={<PolicyManualIntel />} />
          <Route path="/newsroom/visa-bulletin" element={<VisaBulletinIntel />} />
          <Route path="/processing-times" element={<ProcessingTimesIntel />} />
          <Route path="/processing-times/:formId" element={<ProcessingTimesIntel />} />
        </>
      )}

      {/* ── Authenticated App Shell ── */}
      <Route element={<AuthenticatedLayout />}>
        <Route path="/overview" element={<Overview />} />
        <Route path="/change-monitor" element={<ChangeMonitor />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/saved-searches" element={<SavedSearches />} />
        <Route path="/team" element={<Team />} />
        <Route path="/ai-agents" element={<AIAgents />} />
        <Route path="/profile" element={<Profile />} />
        {/* Legacy /dashboard → redirect to /overview */}
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        {/* Legacy /notifications → redirect to /alerts */}
        <Route path="/notifications" element={<Navigate to="/alerts" replace />} />

        {/* Authenticated intelligence pages when logged in */}
        {isAuthenticated && (
          <>
            <Route path="/form/:id" element={<FormDetail />} />
            <Route path="/newsroom/newsroom-alerts" element={<NewsroomAlertsIntel />} />
            <Route path="/newsroom/news-releases" element={<NewsReleasesIntel />} />
            <Route path="/newsroom/policy-updates" element={<PolicyManualIntel />} />
            <Route path="/newsroom/visa-bulletin" element={<VisaBulletinIntel />} />
            <Route path="/processing-times" element={<ProcessingTimesIntel />} />
            <Route path="/processing-times/:formId" element={<ProcessingTimesIntel />} />
          </>
        )}
      </Route>

      {/* ── 404 Fallback ── */}
      <Route
        path="*"
        element={
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100vh', gap: '1rem',
            fontFamily: 'Inter, sans-serif', color: '#6B7280'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#111827' }}>404</div>
            <div style={{ fontSize: '1rem' }}>Page not found</div>
            <a href="/" style={{ color: '#5a7a00', fontWeight: 600, fontSize: '0.9rem' }}>
              Back to Home
            </a>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
