import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LucideRss as RssIcon,
  ArrowLeft as ArrowLeftIcon,
  ExternalLink as ExternalLinkIcon,
  History as HistoryIcon,
  ShieldCheck as ShieldCheckIcon,
  AlertCircle as AlertCircleIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Bell as BellIcon
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeNewsroomModal from '../../components/Modals/SubscribeNewsroomModal';
import './styles.scss';

const NewsroomAlertsIntel = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const resourceId = 'newsroom-alerts';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, isUnsubscribing: false });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const status = await resourceSyncService.getNewsroomStatus(resourceId, user?.email);
      setData(status);
    } catch (err) {
      if (!silent) setError('Unable to load Newsroom Alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.email]);

  const handleSubscriptionSuccess = () => {
    setSubmitting(true);
    setData(prev => ({ ...prev, subscribed: !modalConfig.isUnsubscribing }));
    setTimeout(() => fetchData(true), 1500);
  };

  if (loading) return (
    <div className="intelPage loading">
      <div className="spinner"></div>
      <p>Loading Newsroom Alerts...</p>
    </div>
  );

  if (error || !data) return (
    <div className="intelPage error">
      <div className="errorCard">
        <AlertCircleIcon size={48} />
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  const alerts = data.payload?.alerts || [];

  return (
    <div className="intelPage newsroomAlertsIntel newsroomIntelPage">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeftIcon size={18} /> Back to Home
          </button>
          <div className="headerContent">
            <div className="titleArea">
              <h1>USCIS Newsroom Alerts</h1>
              <p className="subtitle">
                Monitoring official USCIS Newsroom Alerts for breaking announcements, immediate procedural changes, and critical updates.
              </p>
            </div>
            <div className="metaInfo">
              <div className="badge">
                <RssIcon size={14} />
                <span>USCIS Newsroom Alerts Intelligence</span>
              </div>
              <div className="metaItem">
                <ClockIcon size={16} />
                <span>Last Synced: {formatDateTime(data.lastCheckedAt)}</span>
              </div>
              <div className="metaItem">
                <ShieldCheckIcon size={16} />
                <span>Verified Alerts: <strong>{alerts.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <a href="https://www.uscis.gov/newsroom/alerts" target="_blank" rel="noopener noreferrer" className="primaryAction">
              <RssIcon size={18} /> Visit Official Newsroom
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <button className="subscribedBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: true })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircleIcon size={18} />}
                    Subscribed
                  </button>
                ) : (
                  <button className="subscribeBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: false })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <BellIcon size={18} />}
                    Subscribe to Alerts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="contentSection">
        <div className="container">

          <div className="archiveSection">
            <div className="sectionHeader">
              <ShieldCheckIcon size={24} />
              <h2>Current Intelligence Feed</h2>
            </div>

            <div className="versionTimeline">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineDot active"></div>
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="versionTag">{alert.date}</span>
                      </div>
                      <div className="cardContent">
                        <h3>{alert.title}</h3>
                        <div className="intelligenceBox">
                          <span className="impactLabel">Intelligence Summary:</span>
                          <p>{alert.summary}</p>
                        </div>
                        <div className="cardActions" style={{ marginTop: '1.5rem' }}>
                          <a href={alert.url || 'https://www.uscis.gov/newsroom/alerts'} target="_blank" rel="noopener noreferrer" className="sourceLink" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Read Full Alert <ExternalLinkIcon size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noHistory">No active alerts in the current pipeline.</div>
              )}
            </div>
          </div>

          <div className="archiveSection" style={{ marginTop: '6rem' }}>
            <div className="sectionHeader" style={{ opacity: 0.6 }}>
              <HistoryIcon size={24} />
              <h2>Historical Detection Archive</h2>
            </div>

            <div className="versionTimeline">
              {(() => {
                const history = (data.versionHistory || []).filter((_, idx) => idx > 0 || !data.payload);
                if (history.length > 0) {
                  return history.map((version, vIdx) => {
                    const versionAlerts = version.payload?.alerts || [];
                    return (
                      <div key={vIdx} className="timelineItem">
                        <div className="timelineDot"></div>
                        <div className="timelineCard historical">
                          <div className="cardHeader">
                            <span className="versionTag" style={{ background: '#f1f5f9', color: '#475569' }}>
                              {new Date(version.detectedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="cardContent">
                            <h3>{version.summary}</h3>
                            <div className="archiveGrid" style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                              {versionAlerts.map((alert, idx) => (
                                <div key={idx} className="archiveItem" style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: '1rem' }}>
                                  <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>{alert.title}</h4>
                                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>{alert.summary}</p>
                                </div>
                              ))}
                            </div>
                            <div className="cardActions" style={{ marginTop: '1.5rem' }}>
                              <a href={alert.url || 'https://www.uscis.gov/newsroom/alerts'} target="_blank" rel="noopener noreferrer" className="sourceLink" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: '600', textDecoration: 'none', fontSize: '0.85rem' }}>
                                View Original Source <ExternalLinkIcon size={12} />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                } else {
                  return <div className="noHistory">No previous detection events found.</div>;
                }
              })()}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <SubscribeNewsroomModal
        isOpen={modalConfig.isOpen}
        resourceId={resourceId}
        domain={data.domain}
        category={data.category}
        userEmail={user?.email}
        subscriptionId={data.subscriptionId}
        isUnsubscribing={modalConfig.isUnsubscribing}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleSubscriptionSuccess}
      />
      <Footer />
    </div>
  );
};

export default NewsroomAlertsIntel;
