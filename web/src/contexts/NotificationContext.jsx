import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (isAuthenticated && user?.email) {
      try {
        const count = await notificationService.getUnreadCount(user.email.toLowerCase());
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch notifications for badge:', err);
      }
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshUnreadCount();
    // Still poll every 1 minute as a fallback
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
