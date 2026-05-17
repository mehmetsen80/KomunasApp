import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  History,
  ShieldCheck,
  AlertCircle,
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  Bell
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribePolicyModal from '../../components/Modals/SubscribePolicyModal';
import './styles.scss';

const PolicyManualIntel = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const resourceId = 'policy-updates';

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

      const status = await resourceSyncService.getPolicyManualStatus(resourceId, user?.email);
      setData(status);
    } catch (err) {
      if (!silent) setError('Unable to load Policy Manual details.');
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
      <p>Loading Policy Manual records...</p>
    </div>
  );

  if (error || !data) return (
    <div className="intelPage error">
      <div className="errorCard">
        <AlertCircle size={48} />
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  const updates = data.payload?.updates || [];

  return (
    <div className="intelPage policyManualIntel newsroomIntelPage">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={18} /> Back to Home
          </button>
          <div className="headerContent">
            <div className="titleArea">
              <h1>USCIS Policy Manual Updates</h1>
              <p className="subtitle">
                Continuous monitoring of the USCIS Policy Manual for substantive legal shifts, procedural guidance, and official updates.
              </p>
            </div>
            <div className="metaInfo">
              <div className="badge">
                <BookOpen size={14} />
                <span>USCIS Policy Manual Intelligence</span>
              </div>
              <div className="metaItem">
                <Clock size={16} />
                <span>Last Synced: {formatDateTime(data.lastCheckedAt)}</span>
              </div>
              <div className="metaItem">
                <ShieldCheck size={16} />
                <span>Verified Updates: <strong>{updates.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <a href="https://www.uscis.gov/policy-manual/updates" target="_blank" rel="noopener noreferrer" className="primaryAction">
              <BookOpen size={18} /> View Official Policy Manual
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <button className="subscribedBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: true })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircle size={18} />}
                    Subscribed
                  </button>
                ) : (
                  <button className="subscribeBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: false })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <Bell size={18} />}
                    Subscribe to Updates
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
              <ShieldCheck size={24} />
              <h2>Current Legal Intelligence</h2>
            </div>

            <div className="versionTimeline">
              {updates.length > 0 ? (
                updates.map((update, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineDot active"></div>
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="versionTag">{update.date}</span>
                      </div>
                      <div className="cardContent">
                        <h3>{update.title}</h3>
                        <div className="intelligenceBox">
                          <span className="impactLabel">Substantive Legal Impact:</span>
                          <p>{update.summary}</p>
                        </div>
                        {update.chapters && update.chapters.length > 0 && (
                          <div className="policyChapters" style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {update.chapters.map((ch, i) => (
                              <span key={i} className="miniBadge" style={{ background: '#f1f5f9', color: '#1e293b', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #e2e8f0' }}>
                                {ch.title}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="cardActions" style={{ marginTop: '1.5rem' }}>
                          <a href={update.url} target="_blank" rel="noopener noreferrer" className="sourceLink" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Review Official Source <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noHistory">No active updates in the current pipeline.</div>
              )}
            </div>
          </div>

          <div className="archiveSection" style={{ marginTop: '6rem' }}>
            <div className="sectionHeader" style={{ opacity: 0.6 }}>
              <History size={24} />
              <h2>Historical Detection Archive</h2>
            </div>

            <div className="versionTimeline">
              {(() => {
                const history = (data.versionHistory || []).filter((_, idx) => idx > 0 || !data.payload);
                if (history.length > 0) {
                  return history.map((version, vIdx) => {
                    const versionUpdates = version.payload?.updates || [];
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
                              {versionUpdates.map((update, idx) => (
                                <div key={idx} className="archiveItem" style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: '1rem' }}>
                                  <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>{update.title}</h4>
                                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>{update.summary}</p>
                                </div>
                              ))}
                            </div>
                            <div className="cardActions" style={{ marginTop: '1.5rem' }}>
                              <a href={version.resourceUrl || data?.resourceUrl || '#'} target="_blank" rel="noopener noreferrer" className="sourceLink" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: '600', textDecoration: 'none', fontSize: '0.85rem' }}>
                                View Original Source <ExternalLink size={12} />
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

      <SubscribePolicyModal
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

export default PolicyManualIntel;
