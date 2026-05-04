import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  History,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  Bell,
  CheckCircle
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeConfirmModal from '../../components/Modals/SubscribeConfirmModal';
import './styles.scss';

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, isUnsubscribing: false });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await resourceSyncService.getFormStatus(id, user?.email);
      setForm(data);

      if (isAuthenticated && user?.email) {
        const allNotifs = await notificationService.getMyNotifications(user.email);
        // Filter by resourceId and last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filtered = allNotifs.filter(n => {
          const nDate = new Date(n.createdAt);
          return n.resourceId === id && nDate > thirtyDaysAgo;
        });
        setNotifications(filtered);
      }
    } catch (err) {
      setError('Unable to load form details. The resource might not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    const isUnsub = modalConfig.isUnsubscribing;

    // Optimistic update to prevent the "flip-back" effect
    setForm(prev => ({
      ...prev,
      subscribed: !isUnsub
    }));

    // Refresh the real data after a short delay to allow propagation
    setTimeout(fetchData, 1500);
  };

  useEffect(() => {
    fetchData();
  }, [id, isAuthenticated, user?.email]);

  const openSubscribeModal = () => {
    if (!isAuthenticated) return;
    setModalConfig({ isOpen: true, isUnsubscribing: false });
  };

  const openUnsubscribeModal = () => {
    if (!form.subscriptionId) return;
    setModalConfig({ isOpen: true, isUnsubscribing: true });
  };

  if (loading) {
    return (
      <div className="formDetailPage loading">
        <div className="spinner"></div>
        <p>Loading form records...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="formDetailPage error">
        <div className="errorCard">
          <AlertCircle size={48} />
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Library</button>
        </div>
      </div>
    );
  }

  return (
    <div className="formDetailPage">
      <Header transparent />

      <div className="detailNav">
        <button onClick={() => navigate('/')} className="backBtn">
          <ArrowLeft size={20} />
          Back to Library
        </button>
      </div>
      <header className="detailHero">
        <div className="heroContent">
          <div className="formTypeBadge">USCIS {form.domain}</div>
          <h1>{form.resourceId}</h1>
          <p className="formSummary">{form.summary}</p>

          <div className="quickMeta">
            <div className="metaItem">
              <ShieldCheck size={18} />
              <span>Current Version: <strong>{form.currentVersion}</strong></span>
            </div>
            <div className="metaItem">
              <Calendar size={18} />
              <span>Effective: <strong>{form.effectiveDate}</strong></span>
            </div>
            <div className="metaItem">
              <Clock size={18} />
              <span>Last Checked: {formatDateTime(form.lastCheckedAt)}</span>
            </div>
          </div>

          <div className="heroActions">
            <a href={form.resourceUrl} target="_blank" rel="noopener noreferrer" className="primaryAction">
              <Download size={20} />
              Download Latest Form (PDF)
            </a>
            <a href={form.instructionsUrl} target="_blank" rel="noopener noreferrer" className="secondaryAction">
              <FileText size={20} />
              View Instructions
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {form.subscribed ? (
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
        {notifications.length > 0 && (
          <section className="alertsSection">
            <div className="sectionHeader">
              <AlertTriangle size={24} className="alertIcon" />
              <h2>Recent Important Updates</h2>
            </div>
            <div className="alertsList">
              {notifications.map((n, i) => (
                <div key={i} className={`alertItem ${n.severity === 'HIGH' ? 'high' : ''}`}>
                  <div className="alertHeader">
                    <span className="alertType">{n.type}</span>
                    <span className="alertDate">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <h3 className="alertSummary">{n.summary}</h3>
                  <p className="alertDetails">{n.details.split('\n')[0]}...</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {form.supplementalResources && Object.keys(form.supplementalResources).length > 0 && (
          <section className="supplementalSection">
            <div className="sectionHeader">
              <ShieldCheck size={24} />
              <h2>Supplemental Information</h2>
            </div>
            <div className="supplementalGrid">
              {Object.entries(form.supplementalResources).map(([key, res]) => (
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
            <h2>Version History</h2>
          </div>

          <div className="timeline">
            {form.versionHistory && form.versionHistory.length > 0 ? (
              form.versionHistory.map((entry, index) => (
                <div key={index} className={`timelineItem ${entry.changeDetected ? 'critical' : ''}`}>
                  <div className="timelineDot"></div>
                  <div className="timelineCard">
                    <div className="cardHeader">
                      <div className="tagWrapper">
                        <span className="versionTag">v{entry.version}</span>
                        {entry.changeDetected && (
                          <span className="criticalBadge">
                            <AlertTriangle size={12} />
                            CRITICAL CHANGE
                          </span>
                        )}
                      </div>
                      <span className="dateTag">{formatDateTime(entry.detectedAt)}</span>
                    </div>
                    <p className="cardSummary">{entry.summary}</p>
                    <div className="cardActions">
                      <a href={entry.resourceUrl} target="_blank" rel="noopener noreferrer">
                        <Download size={14} /> PDF
                      </a>
                      <a href={entry.instructionsUrl} target="_blank" rel="noopener noreferrer">
                        <FileText size={14} /> Instructions
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="noHistory">No version history available for this form.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <SubscribeConfirmModal
        isOpen={modalConfig.isOpen}
        formId={id}
        domain={form?.domain}
        category={form?.category}
        userEmail={user?.email}
        subscriptionId={form?.subscriptionId}
        isUnsubscribing={modalConfig.isUnsubscribing}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default FormDetail;
