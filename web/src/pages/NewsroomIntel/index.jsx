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
  Rss,
  BookOpen
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeNewsroomModal from '../../components/Modals/SubscribeNewsroomModal';
import SubscribePolicyModal from '../../components/Modals/SubscribePolicyModal';
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

      let data;
      if (id === 'policy-updates') {
        data = await resourceSyncService.getPolicyManualStatus(id, user?.email);
      } else {
        data = await resourceSyncService.getNewsroomStatus(id, user?.email);
      }
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

  const alerts = newsroom.payload?.alerts || newsroom.payload?.updates || [];

  const getCanonicalUrl = (version) => {
    if (version?.resourceUrl) return version.resourceUrl;
    if (newsroom?.resourceUrl) return newsroom.resourceUrl;
    
    // Explicit hardcoded fallbacks based on resource ID
    const resourceId = id || newsroom?.resourceId;
    if (resourceId === 'policy-updates') return 'https://www.uscis.gov/policy-manual/updates';
    if (resourceId === 'newsroom-alerts') return 'https://www.uscis.gov/newsroom/alerts';
    if (resourceId === 'news-releases') return 'https://www.uscis.gov/newsroom/news-releases';
    
    return 'https://www.uscis.gov';
  };

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
          <p className="formSummary">
            {newsroom.payload?.summary || 'Monitoring USCIS for policy updates, procedural changes, and breaking news releases.'}
          </p>

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
              {id === 'policy-updates' ? <BookOpen size={20} /> : <Rss size={20} />}
              {id === 'policy-updates' ? 'View Policy Manual' : 'Visit Official Newsroom'}
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
            <Rss size={24} />
            <h2>Current Intelligence Feed</h2>
          </div>

          <div className="currentIntelligence" style={{ marginBottom: '5rem' }}>
            {alerts.length > 0 ? (
              <div className="versionUpdates">
                {alerts.map((alert, index) => (
                  <div key={index} className="timelineItem">
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="dateTag">{alert.date}</span>
                      </div>
                      <p className="cardSummary">{alert.title}</p>
                      <div className="alertDescriptionBox">
                        {id === 'policy-updates' && (
                          <span className="impactLabel">Substantive Impact:</span>
                        )}
                        <p className="alertDetails">{alert.summary}</p>
                      </div>
                      <div className="cardActions">
                        <a href={alert.url || getCanonicalUrl()} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={14} /> {id === 'policy-updates' ? 'Review Substantive Changes' : 'Read Full Alert'}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="noHistory">
                <p>No active alerts in the current pipeline.</p>
              </div>
            )}
          </div>

          <div className="sectionHeader" style={{ opacity: 0.6, marginTop: '5rem' }}>
            <History size={24} />
            <h2>Historical Detection Archive</h2>
          </div>

          <div className="versionTimeline">
            {(() => {
              const filteredHistory = (newsroom.versionHistory || []).filter((_, idx) => idx > 0 || !newsroom.payload);
              if (filteredHistory.length > 0) {
                return filteredHistory.map((version, vIndex) => {
                  const versionUpdates = version.payload?.alerts || version.payload?.updates || [];
                  const hasDetails = versionUpdates.length > 0;

                  return (
                    <div key={vIndex} className="versionGroup">
                      <div className="versionHeader">
                        <div className="versionDot"></div>
                        <div className="versionInfo">
                          <span className="versionMeta">
                            Detection Event • {formatDateTime(version.detectedAt)}
                          </span>
                          <h2>{version.summary}</h2>
                        </div>
                      </div>

                      <div className="versionUpdates">
                        {hasDetails ? (
                          versionUpdates.map((alert, index) => (
                            <div key={index} className="timelineItem">
                              <div className="timelineCard">
                                <div className="cardHeader">
                                  <span className="dateTag">{alert.date}</span>
                                </div>
                                <p className="cardSummary">{alert.title}</p>
                                <div className="alertDescriptionBox">
                                  {id === 'policy-updates' && (
                                    <span className="impactLabel">Substantive Impact:</span>
                                  )}
                                  <p className="alertDetails">{alert.summary}</p>
                                </div>
                                {alert.chapters && alert.chapters.length > 0 && (
                                  <div className="policyChapters">
                                    {alert.chapters.map((ch, idx) => (
                                      <span key={idx} className="miniBadge">{ch.title}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="cardActions">
                                  <a href={alert.url || getCanonicalUrl(version)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={14} /> {id === 'policy-updates' ? 'Review Substantive Changes' : 'Read Full Alert'}
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="timelineItem fallback">
                            <div className="timelineCard">
                               <div className="alertDescriptionBox">
                                  <p className="alertDetails">{version.summary}</p>
                               </div>
                               <div className="cardActions">
                                  <a href={getCanonicalUrl(version)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={14} /> View Original Source
                                  </a>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="noHistory">
                    <p>No previous detection events found in the historical archive.</p>
                  </div>
                );
              }
            })()}
          </div>
        </section>
      </main>

      <Footer />

      {id === 'policy-updates' ? (
        <SubscribePolicyModal
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
      ) : (
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
      )}
    </div>
  );
};

export default NewsroomIntel;
