import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import FormDetail from '../pages/FormDetail';
import Dashboard from '../pages/Dashboard';

// Components
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/form/:id" element={<FormDetail />} />
      
      {/* Placeholder for future auth pages */}
      <Route path="/login" element={<div>Login Page (Coming Soon)</div>} />

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
