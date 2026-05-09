import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import FormDetail from '../pages/FormDetail';
import NewsroomAlertsIntel from '../pages/NewsroomAlertsIntel';
import NewsReleasesIntel from '../pages/NewsReleasesIntel';
import PolicyManualIntel from '../pages/PolicyManualIntel';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Notifications from '../pages/Notifications';

// Components
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/form/:id" element={<FormDetail />} />
      <Route path="/newsroom/newsroom-alerts" element={<NewsroomAlertsIntel />} />
      <Route path="/newsroom/news-releases" element={<NewsReleasesIntel />} />
      <Route path="/newsroom/policy-updates" element={<PolicyManualIntel />} />
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        {/* Add more administrative routes here */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
