import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationService from '../../services/notificationService';
import Markdown from '../../components/Markdown';
import DeltaView from '../../components/DeltaView';
import { formatDateTime } from '../../utils/dateUtils';
import './styles.scss';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Notifications = () => {
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotifications();
  const navigate = useNavigate();
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
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      handleMarkAsRead(id);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return <AlertCircle className="severityIcon high" size={24} />;
      case 'MEDIUM': return <AlertTriangle className="severityIcon medium" size={24} />;
      default: return <Info className="severityIcon low" size={24} />;
    }
  };

  return (
    <div className="notificationsPage intelPage newsroomIntelPage">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={18} /> Back to Home
          </button>
          <div className="headerContent">
            <div className="titleArea">
              <div className="badge">
                <Bell size={14} />
                <span>Intelligence Feed</span>
              </div>
              <h1>Update Notifications</h1>
              <p className="subtitle">
                High-fidelity alerts and change detection analysis from your monitored USCIS resources.
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="metaInfo">
                <div className="metaItem">
                  <Bell size={16} />
                  <span>Unread Alerts: <strong>{notifications.filter(n => !n.read).length}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="contentSection">
        <div className="container">
          {loading && (
            <div className="loadingState">
              <div className="spinner"></div>
              <p>Fetching your latest updates...</p>
            </div>
          )}

          {error && (
            <div className="errorState">
              <AlertTriangle size={48} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="emptyState">
              <Bell size={64} />
              <h3>No notifications yet</h3>
              <p>You'll see alerts here when the USCIS resources you monitor are updated with new editions or policy changes.</p>
              <Link to="/" className="primaryAction" style={{ marginTop: '2rem', display: 'inline-flex' }}>
                Explore Library
              </Link>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
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
                        <span className="resourceIdBadge">{notif.resourceId}</span>
                        <span className="timestamp">{formatDateTime(notif.createdAt)}</span>
                      </div>
                      <h3 className="summary">{notif.summary}</h3>
                    </div>
                    <div className="expandToggle">
                      {expandedId === notif.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>

                  {expandedId === notif.id && (
                    <div className="itemDetails">
                      <div className="intelligenceBox">
                        <span className="impactLabel">Alert Analysis:</span>
                        <div className="detailsText">
                          <Markdown content={notif.details} />
                        </div>
                      </div>

                      {notif.delta && <DeltaView delta={notif.delta} />}

                      <div className="cardActions" style={{ marginTop: '2rem' }}>
                        <Link to={`/form/${notif.resourceId}`} className="sourceLink" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
                          View Comprehensive Records <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
