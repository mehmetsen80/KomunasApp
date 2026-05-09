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
        <button onClick={() => navigate('/')}>Back to Library</button>
      </div>
    </div>
  );

  const alerts = data.payload?.alerts || [];

  return (
    <div className="intelPage newsroomAlertsIntel">
      <Header transparent />

      <header className="detailHero">
        <div className="heroContent">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeftIcon size={20} />
            Back to Library
          </button>
          <div className="formTypeBadge">USCIS {data.domain}</div>
          <h1>USCIS Newsroom Alerts</h1>
          <p className="formSummary">
            Monitoring official USCIS Newsroom Alerts for breaking announcements and immediate procedural changes.
          </p>

          <div className="quickMeta">
            <div className="metaItem">
              <ShieldCheckIcon size={18} />
              <span>Active Alerts: <strong>{alerts.length}</strong></span>
            </div>
            <div className="metaItem">
              <ClockIcon size={18} />
              <span>Last Checked: {formatDateTime(data.lastCheckedAt)}</span>
            </div>
          </div>

          <div className="heroActions">
            <a href="https://www.uscis.gov/newsroom/alerts" target="_blank" rel="noopener noreferrer" className="primaryAction">
              <RssIcon size={20} /> Visit Official Newsroom
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <button className="subscribedBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: true })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircleIcon size={20} />} Subscribed
                  </button>
                ) : (
                  <button className="subscribeBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: false })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <BellIcon size={20} />} Subscribe to Alerts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="detailContent">
        <section className="historySection">
          <div className="sectionHeader">
            <RssIcon size={24} />
            <h2>Current Alerts Feed</h2>
          </div>

          <div className="currentIntelligence">
            {alerts.length > 0 ? (
              <div className="versionUpdates">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="dateTag">{alert.date}</span>
                      </div>
                      <p className="cardSummary">{alert.title}</p>
                      <div className="alertDescriptionBox">
                        <span className="impactLabel">Intelligence Summary:</span>
                        <p className="alertDetails">{alert.summary}</p>
                      </div>
                      <div className="cardActions">
                        <a href={alert.url || 'https://www.uscis.gov/newsroom/alerts'} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkIcon size={14} /> Read Full Alert
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noHistory"><p>No active alerts in the current pipeline.</p></div>
            )}
          </div>

          <div className="sectionHeader" style={{ opacity: 0.6, marginTop: '5rem' }}>
            <HistoryIcon size={24} />
            <h2>Historical Alert Archive</h2>
          </div>

          <div className="versionTimeline">
            {(() => {
              const history = (data.versionHistory || []).filter((_, idx) => idx > 0 || !data.payload);
              if (history.length > 0) {
                return history.map((version, vIdx) => (
                  <div key={vIdx} className="versionGroup">
                    <div className="versionHeader">
                      <div className="versionDot"></div>
                      <div className="versionInfo">
                        <span className="versionMeta">Detection Event • {formatDateTime(version.detectedAt)}</span>
                        <h2>{version.summary}</h2>
                      </div>
                    </div>
                    <div className="versionUpdates">
                      {(version.payload?.alerts || []).map((alert, i) => (
                        <div key={i} className="timelineItem">
                          <div className="timelineCard">
                            <div className="cardHeader"><span className="dateTag">{alert.date}</span></div>
                            <p className="cardSummary">{alert.title}</p>
                            <div className="alertDescriptionBox">
                              <span className="impactLabel">Summary:</span>
                              <p className="alertDetails">{alert.summary}</p>
                            </div>
                            <div className="cardActions">
                              <a href={alert.url || 'https://www.uscis.gov/newsroom/alerts'} target="_blank" rel="noopener noreferrer">
                                <ExternalLinkIcon size={14} /> View Original Source
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              } else {
                return <div className="noHistory"><p>No previous detection events found in the historical archive.</p></div>;
              }
            })()}
          </div>
        </section>
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
    </div>
  );
};

export default NewsroomAlertsIntel;
