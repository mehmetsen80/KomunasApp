import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Sidebar from '../Sidebar';
import TopBar from '../TopBar';
import Footer from '../Footer';
import './styles.scss';

const AuthenticatedLayout = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="appShell">
      <Sidebar unreadCount={unreadCount} />
      <div className="appContent">
        <TopBar unreadCount={unreadCount} />
        <main className="appMain">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
