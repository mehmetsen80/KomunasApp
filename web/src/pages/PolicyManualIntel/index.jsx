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
        <button onClick={() => navigate('/')}>Back to Library</button>
      </div>
    </div>
  );

  const updates = data.payload?.updates || [];

  return (
    <div className="intelPage policyManualIntel">
      <Header transparent />

      <header className="detailHero">
        <div className="heroContent">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={20} />
            Back to Library
          </button>
          <div className="formTypeBadge">USCIS {data.domain}</div>
          <h1>USCIS Policy Manual Updates</h1>
          <p className="formSummary">
            Continuous monitoring of the USCIS Policy Manual for substantive legal shifts and procedural updates.
          </p>

          <div className="quickMeta">
            <div className="metaItem">
              <ShieldCheck size={18} />
              <span>Active Alerts: <strong>{updates.length}</strong></span>
            </div>
            <div className="metaItem">
              <Clock size={18} />
              <span>Last Checked: {formatDateTime(data.lastCheckedAt)}</span>
            </div>
          </div>

          <div className="heroActions">
            <a href="https://www.uscis.gov/policy-manual/updates" target="_blank" rel="noopener noreferrer" className="primaryAction">
              <BookOpen size={20} /> View Official Policy Manual
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <button className="subscribedBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: true })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircle size={20} />} Subscribed
                  </button>
                ) : (
                  <button className="subscribeBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: false })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <Bell size={20} />} Subscribe to Updates
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
            <ShieldCheck size={24} />
            <h2>Current Legal Updates</h2>
          </div>

          <div className="currentIntelligence">
            {updates.length > 0 ? (
              <div className="versionUpdates">
                {updates.map((update, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="dateTag">{update.date}</span>
                      </div>
                      <p className="cardSummary">{update.title}</p>
                      <div className="alertDescriptionBox">
                        <span className="impactLabel">Substantive Legal Impact:</span>
                        <p className="alertDetails">{update.summary}</p>
                      </div>
                      {update.chapters && update.chapters.length > 0 && (
                        <div className="policyChapters">
                          {update.chapters.map((ch, i) => (
                            ch.url ? (
                              <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer" className="miniBadge clickable">
                                {ch.title} <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span key={i} className="miniBadge">{ch.title}</span>
                            )
                          ))}
                        </div>
                      )}
                      {update.url && (
                        <div className="cardActions">
                          <a href={update.url} target="_blank" rel="noopener noreferrer" className="primaryBtn">
                            View Source Material <ExternalLink size={16} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noHistory"><p>No active legal updates in the current pipeline.</p></div>
            )}
          </div>

          <div className="sectionHeader" style={{ opacity: 0.6, marginTop: '5rem' }}>
            <History size={24} />
            <h2>Historical Legal Archive</h2>
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
                      {(version.payload?.updates || []).map((update, i) => (
                        <div key={i} className="timelineItem">
                          <div className="timelineCard">
                            <div className="cardHeader"><span className="dateTag">{update.date}</span></div>
                            <p className="cardSummary">{update.title}</p>
                            <div className="alertDescriptionBox">
                              <span className="impactLabel">Substantive Impact:</span>
                              <p className="alertDetails">{update.summary}</p>
                            </div>
                            {update.url && (
                              <div className="cardActions">
                                <a href={update.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink size={14} /> View Original Source
                                </a>
                              </div>
                            )}
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
    </div>
  );
};

export default PolicyManualIntel;
