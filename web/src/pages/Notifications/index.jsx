import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import Markdown from '../../components/Markdown';
import DeltaView from '../../components/DeltaView';
import { formatDateTime } from '../../utils/dateUtils';
import './styles.scss';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications(user.email);
      setNotifications(data);
    } catch (err) {
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.email]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    // Mark as read when expanded if not already read
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      handleMarkAsRead(id);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return <AlertCircle className="severityIcon high" size={20} />;
      case 'MEDIUM': return <AlertTriangle className="severityIcon medium" size={20} />;
      default: return <Info className="severityIcon low" size={20} />;
    }
  };

  return (
    <div className="notificationsPage">
      <header className="pageHeader">
        <Link to="/" className="backBtn">
          <ArrowLeft size={20} />
          Back to Library
        </Link>
        <h1>Update Notifications</h1>
      </header>

      <main className="notificationsContent">
        {loading && (
          <div className="loadingState">
            <div className="spinner"></div>
            <p>Fetching your latest updates...</p>
          </div>
        )}

        {error && <div className="errorState">{error}</div>}

        {!loading && !error && notifications.length === 0 && (
          <div className="emptyState">
            <Bell size={48} />
            <h3>No notifications yet</h3>
            <p>You'll see alerts here when the USCIS forms you monitor are updated.</p>
          </div>
        )}

        <div className="notificationsList">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notificationItem ${notif.read ? 'read' : 'unread'} ${expandedId === notif.id ? 'expanded' : ''}`}
            >
              <div className="itemMain" onClick={() => toggleExpand(notif.id)}>
                <div className="severityWrapper">
                  {getSeverityIcon(notif.severity)}
                </div>
                <div className="itemContent">
                  <div className="itemHeader">
                    <span className="resourceId">{notif.resourceId}</span>
                    <span className="timestamp">{formatDateTime(notif.createdAt)}</span>
                  </div>
                  <h3 className="summary">{notif.summary}</h3>
                </div>
                <div className="expandToggle">
                  {expandedId === notif.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === notif.id && (
                <div className="itemDetails">
                  <div className="detailsText">
                    <Markdown content={notif.details} />
                  </div>
                  
                  {notif.delta && <DeltaView delta={notif.delta} />}

                  <div className="actions">
                    {!notif.read && (
                      <button onClick={() => handleMarkAsRead(notif.id)} className="readBtn">
                        <Check size={16} /> Mark as Read
                      </button>
                    )}
                    <Link to={`/form/${notif.resourceId}`} className="viewFormBtn">
                      View Form Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
