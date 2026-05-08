import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  History,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Bell,
  CheckCircle,
  Rss
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeNewsroomModal from '../../components/Modals/SubscribeNewsroomModal';
import './styles.scss';

const NewsroomIntel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [newsroom, setNewsroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, isUnsubscribing: false });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const data = await resourceSyncService.getNewsroomStatus(id, user?.email);
      setNewsroom(data);
    } catch (err) {
      if (!silent) setError('Unable to load newsroom details. The resource might not exist.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSubmitting(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    const isUnsub = modalConfig.isUnsubscribing;

    // 1. Enter submitting state for the button
    setSubmitting(true);

    // 2. Optimistic update to UI state
    setNewsroom(prev => ({
      ...prev,
      subscribed: !isUnsub
    }));

    // 3. Refresh real data in background after short delay
    setTimeout(() => fetchData(true), 1500);
  };

  useEffect(() => {
    fetchData();
  }, [id, isAuthenticated, user?.email]);

  const openSubscribeModal = () => {
    if (!isAuthenticated) return;
    setModalConfig({ isOpen: true, isUnsubscribing: false });
  };

  const openUnsubscribeModal = () => {
    if (!newsroom.subscriptionId) return;
    setModalConfig({ isOpen: true, isUnsubscribing: true });
  };

  if (loading) {
    return (
      <div className="newsroomIntelPage loading">
        <div className="spinner"></div>
        <p>Loading newsroom records...</p>
      </div>
    );
  }

  if (error || !newsroom) {
    return (
      <div className="newsroomIntelPage error">
        <div className="errorCard">
          <AlertCircle size={48} />
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Library</button>
        </div>
      </div>
    );
  }

  const alerts = newsroom.payload?.alerts || [];

  return (
    <div className="newsroomIntelPage">
      <Header transparent />

      <header className="detailHero">
        <div className="heroContent">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={20} />
            Back to Library
          </button>
          <div className="formTypeBadge">USCIS {newsroom.domain}</div>
          <h1>{newsroom.summary || (id === 'news-releases' ? 'News Releases' : 'Newsroom Alerts')}</h1>
          <p className="formSummary">Monitoring USCIS for policy updates, procedural changes, and breaking news releases.</p>

          <div className="quickMeta">
            <div className="metaItem">
              <ShieldCheck size={18} />
              <span>Active Alerts: <strong>{alerts.length}</strong></span>
            </div>
            {newsroom.effectiveDate && (
              <div className="metaItem">
                <Calendar size={18} />
                <span>Effective: <strong>{newsroom.effectiveDate}</strong></span>
              </div>
            )}
            <div className="metaItem">
              <Clock size={18} />
              <span>Last Checked: {formatDateTime(newsroom.lastCheckedAt)}</span>
            </div>
          </div>

          <div className="heroActions">
            <a href={newsroom.resourceUrl || 'https://www.uscis.gov/newsroom/alerts'} target="_blank" rel="noopener noreferrer" className="primaryAction">
              <Rss size={20} />
              Visit Official Newsroom
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {newsroom.subscribed ? (
                  <button
                    className="subscribedBtn"
                    onClick={openUnsubscribeModal}
                    disabled={submitting}
                  >
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircle size={20} />}
                    Subscribed
                  </button>
                ) : (
                  <button
                    className="subscribeBtn"
                    onClick={openSubscribeModal}
                    disabled={submitting}
                  >
                    {submitting ? <div className="mini-spinner"></div> : <Bell size={20} />}
                    Subscribe to Updates
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="detailContent">

        {newsroom.supplementalResources && Object.keys(newsroom.supplementalResources).length > 0 && (
          <section className="supplementalSection">
            <div className="sectionHeader">
              <ShieldCheck size={24} />
              <h2>Supplemental Information</h2>
            </div>
            <div className="supplementalGrid">
              {Object.entries(newsroom.supplementalResources).map(([key, res]) => (
                <div key={key} className="supplementalCard">
                  <h3>{key}</h3>
                  <p>{res.summary || 'Additional resource'}</p>
                  {res.url && (
                    <a href={res.url} target="_blank" rel="noopener noreferrer">
                      View Resource <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="historySection">
          <div className="sectionHeader">
            <History size={24} />
            <h2>Latest Alerts Pipeline</h2>
          </div>

          <div className="timeline">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div key={index} className="timelineItem">
                  <div className="timelineDot"></div>
                  <div className="timelineCard">
                    <div className="cardHeader">
                      <span className="dateTag">{alert.date}</span>
                    </div>
                    <p className="cardSummary">{alert.title}</p>
                    <p className="alertDetails" style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>{alert.summary}</p>
                    <div className="cardActions">
                      <a href={alert.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} /> Read Full Alert
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="noHistory">No alerts found in the current state.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <SubscribeNewsroomModal
        isOpen={modalConfig.isOpen}
        resourceId={id}
        domain={newsroom?.domain}
        category={newsroom?.category}
        userEmail={user?.email}
        subscriptionId={newsroom?.subscriptionId}
        isUnsubscribing={modalConfig.isUnsubscribing}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default NewsroomIntel;
