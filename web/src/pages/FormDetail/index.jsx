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
  CheckCircle,
  Activity
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeFormModal from '../../components/Modals/SubscribeFormModal';
import './styles.scss';

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, isUnsubscribing: false });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await resourceSyncService.getFormStatus(id, user?.email);
      setForm(data);
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
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="formDetailPage intelPage">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={18} /> Back to Home
          </button>
          <div className="headerContent">
            <div className="titleArea">
              <h1>{form.displayName}</h1>
              <p className="formSummary">{form.summary}</p>
            </div>

            <div className="metaInfo">
              <div className="formTypeBadge">USCIS Form Intelligence</div>
              <div className="metaItem">
                <ShieldCheck size={16} />
                <span>Current Version: <strong>{form.currentVersion}</strong></span>
              </div>
              <div className="metaItem">
                <Calendar size={16} />
                <span>Effective: <strong>{form.effectiveDate}</strong></span>
              </div>
              <div className="metaItem">
                <Clock size={16} />
                <span>Last Checked: {formatDateTime(form.lastCheckedAt)}</span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <a href={form.resourceUrl} target="_blank" rel="noopener noreferrer" className="primaryAction">
              <Download size={18} /> Download Latest Form (PDF)
            </a>
            <a href={form.instructionsUrl} target="_blank" rel="noopener noreferrer" className="secondaryAction">
              <FileText size={18} /> View Official Instructions
            </a>
            
            <button onClick={() => navigate(`/processing-times/${id}`)} className="secondaryAction" style={{ background: 'white', color: '#1e293b', border: '1px solid #e2e8f0' }}>
              <Activity size={18} /> Processing Times Intel
            </button>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {form.subscribed ? (
                  <div className="statusBadge subscribed big">
                    <ShieldCheck size={18} />
                    <span>Subscribed to Alerts</span>
                  </div>
                ) : (
                  <button className="subscribeBtnLink" onClick={openSubscribeModal} disabled={submitting}>
                    <Bell size={18} />
                    Subscribe to Updates
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="detailContent">
        <div className="container">

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
                            (entry.payload?.status === "INITIAL_DISCOVERY" || 
                             entry.payload?.categories?.some(c => c.status === "INITIAL_DISCOVERY") ||
                             entry.changeType === "INITIAL_DISCOVERY" ||
                             entry.summary?.includes("Baseline established")) ? (
                              <span className="baselineBadge">
                                <Info size={12} />
                                INITIAL DISCOVERY
                              </span>
                            ) : (
                              <span className="criticalBadge">
                                <AlertTriangle size={12} />
                                CRITICAL CHANGE
                              </span>
                            )
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
        </div>
      </main>

      <Footer />

      <SubscribeFormModal
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
