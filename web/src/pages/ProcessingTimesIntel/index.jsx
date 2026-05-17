import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  History,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  Bell,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Info,
  FileText,
  ArrowRight
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SubscribeProcessingTimesModal from '../../components/Modals/SubscribeProcessingTimesModal';
import './styles.scss';

// Map USCIS category codes to human-readable labels
const CATEGORY_LABELS = {
  '134A-F21': 'Permanent resident filing for spouse or child under 21',
  '134A-IR':  'U.S. citizen filing for spouse, parent, or child under 21',
  '134B-F11': 'U.S. citizen filing for unmarried son/daughter 21+',
  '134B-F24': 'Permanent resident for unmarried son/daughter 21+',
  '134B-F31': 'U.S. citizen filing for married son or daughter',
  '134B-F41': 'U.S. citizen filing for brother or sister',
};

// ── Landing page: list all tracked forms ──
const ProcessingTimesLanding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const data = await resourceSyncService.getAllProcessingTimesStatuses(user?.email);
        setForms(data);
      } catch (err) {
        setError('Unable to load Processing Times data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.email]);

  if (loading) return (
    <div className="intelPage loading">
      <div className="spinner"></div>
      <p>Loading Processing Times Intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="intelPage error">
      <div className="errorCard">
        <AlertCircle size={48} />
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  // Group forms by resourceId (e.g., I-130, I-485)
  const grouped = forms.reduce((acc, form) => {
    const id = form.resourceId;
    if (!acc[id]) {
      acc[id] = { resourceId: id, items: [], latestSync: null, changeDetected: false, subscribed: false };
    }
    acc[id].items.push(form);
    if (form.changeDetected) acc[id].changeDetected = true;
    if (form.subscribed) acc[id].subscribed = true;
    const checked = form.lastCheckedAt ? new Date(form.lastCheckedAt).getTime() : 0;
    if (!acc[id].latestSync || checked > acc[id].latestSync) {
      acc[id].latestSync = checked;
      acc[id].summary = form.summary;
      acc[id].currentVersion = form.currentVersion;
    }
    return acc;
  }, {});

  const formGroups = Object.values(grouped);

  return (
    <div className="intelPage processingTimesIntel">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/')} className="backBtn">
            <ArrowLeft size={18} /> Back to Home
          </button>

          <div className="headerContent">
            <div className="titleArea">
              <h1>Processing Times Dashboard</h1>
              <p className="subtitle">
                AI-driven analysis of estimated wait times, historical trends, and Visa Bulletin constraints across all monitored USCIS forms.
              </p>
            </div>
            <div className="metaInfo">
              <div className="badge">
                <Activity size={14} />
                <span>USCIS Processing Times Intelligence</span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <a href="https://egov.uscis.gov/processing-times" target="_blank" rel="noopener noreferrer" className="primaryAction">
              <ExternalLink size={18} /> View Official Processing Times
            </a>
          </div>
        </div>
      </div>

      <main className="contentSection">
        <div className="container">

          {formGroups.length === 0 ? (
            <div className="noHistory" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No Processing Times Data Yet</h3>
              <p>Processing times intelligence will appear here once the monitoring workflows have synced.</p>
            </div>
          ) : (
            <div className="formGrid">
              {formGroups.map(group => (
                <Link key={group.resourceId} to={`/processing-times/${group.resourceId}`} className={`formCard ${group.changeDetected ? 'hasChange' : ''}`}>
                  <div className="formCardHeader">
                    <div className="formIcon">
                      <FileText size={24} />
                    </div>
                    <div className="formMeta">
                      {group.changeDetected && (
                        <span className="changeBadge">Update Detected</span>
                      )}
                      {group.subscribed && (
                        <span className="subscribedBadge"><CheckCircle size={12} /> Subscribed</span>
                      )}
                    </div>
                  </div>
                  <h3 className="formId">{group.resourceId}</h3>
                  <p className="formSummary">{group.summary || 'Processing times analysis available.'}</p>
                  <div className="formFooter">
                    <span className="syncTime">
                      <Clock size={13} />
                      {group.latestSync ? formatDateTime(group.latestSync) : 'N/A'}
                    </span>
                    <span className="viewLink">
                      View Analysis <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

// ── Detail page: show a specific form's analysis ──
const ProcessingTimesDetail = ({ formId }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, isUnsubscribing: false });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const status = await resourceSyncService.getProcessingTimesStatus(formId, user?.email);
      setData(status);
    } catch (err) {
      if (!silent) setError(`Unable to load Processing Times for ${formId}.`);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.email, formId]);

  const handleSubscriptionSuccess = () => {
    setSubmitting(true);
    setData(prev => ({ ...prev, subscribed: !modalConfig.isUnsubscribing }));
    setTimeout(() => fetchData(true), 1500);
  };

  if (loading) return (
    <div className="intelPage loading">
      <div className="spinner"></div>
      <p>Loading Processing Times Intelligence...</p>
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

  const payload = data.payload || {};
  const history = data.versionHistory || [];

  return (
    <div className="intelPage processingTimesIntel">
      <Header transparent />

      <div className="pageHeader">
        <div className="container">
          <button onClick={() => navigate('/processing-times')} className="backBtn">
            <ArrowLeft size={18} /> Back to All Processing Times
          </button>
          
          <div className="headerContent">
            <div className="titleArea">
              <h1>{formId} Backlog Analysis</h1>
              <p className="subtitle">
                AI-driven analysis of estimated time ranges, historical trends, and Visa Bulletin constraints affecting Form {formId} petitions.
              </p>
            </div>
            
            <div className="metaInfo">
              <div className="badge">
                <Activity size={14} />
                <span>USCIS Processing Times Intelligence</span>
              </div>
              <div className="metaItem">
                <Clock size={16} />
                <span>Last Synced: {formatDateTime(data.lastCheckedAt)}</span>
              </div>
              <div className="metaItem">
                <Layers size={16} />
                <span>Version: <strong>{data.currentVersion}</strong></span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <a href={data.resourceUrl || 'https://egov.uscis.gov/processing-times'} target="_blank" rel="noopener noreferrer" className="primaryAction">
              <ExternalLink size={18} /> View Official Processing Times
            </a>

            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <button className="subscribedBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: true })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <CheckCircle size={18} />}
                    Alerts Active
                  </button>
                ) : (
                  <button className="subscribeBtn" onClick={() => setModalConfig({ isOpen: true, isUnsubscribing: false })} disabled={submitting}>
                    {submitting ? <div className="mini-spinner"></div> : <Bell size={18} />}
                    Get {formId} Alerts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="contentSection">
        <div className="container">
          
          {/* Current Intelligence Overview */}
          {payload && (
            <div className="dashboardGrid">
              
              <div className="metricsSidebar">
                <div className="metricCard">
                  <div className="metricIcon"><Calendar size={24} /></div>
                  <div className="metricContent">
                    <label className="tooltip-container">
                      Estimated 80th Percentile
                      <Info size={14} className="info-icon" />
                      <span className="tooltip-text">
                        The "80th Percentile" means that USCIS completes 80% of cases within this timeframe. The remaining 20% of cases take longer due to individual complexities or additional reviews.
                      </span>
                    </label>
                    <div className="metricValue">{payload.percentile80 || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="metricCard highlight">
                  <div className="metricIcon"><TrendingUp size={24} /></div>
                  <div className="metricContent">
                    <label>Overall Trend</label>
                    <div className="metricValue">{payload.trend || 'Stable'}</div>
                  </div>
                </div>
              </div>

              <div className="mainAnalysisCard">
                <div className="cardHeader">
                  <ShieldCheck size={24} />
                  <h2>Executive Summary</h2>
                </div>
                <div className="cardBody">
                  <h3 className="analysisTitle">{payload.title}</h3>
                  <p className="summaryText">{payload.summary}</p>
                  
                  <div className="deepAnalysisBox">
                    <h4>Substantive Impact & Visa Bulletin Constraints</h4>
                    <p>{payload.analysis}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Combinations Breakdown */}
          {payload.combinations && Object.keys(payload.combinations).length > 0 && (
            <div className="combinationsSection">
              <div className="sectionHeader">
                <Layers size={24} />
                <h2>Office &amp; Category Breakdown</h2>
              </div>
              <p className="sectionSubtitle">
                Individual processing time estimates for each office and preference category tracked by USCIS.
              </p>
              <div className="combinationsGrid">
                {Object.entries(payload.combinations).map(([key, combo]) => {
                  const officeName = combo.officeCode === 'FOD' ? 'All Field Offices' 
                    : combo.officeCode === 'NBC' ? 'National Benefits Center'
                    : combo.officeCode === 'SCD' ? 'Service Center Operations'
                    : combo.officeCode || 'Unknown';
                  const categoryLabel = combo.categoryLabel || CATEGORY_LABELS[combo.formCategory] || combo.formCategory || 'General';
                  const hasError = !!combo.error;
                  const time = combo.estimatedTime || 'N/A';
                  const unit = combo.timeUnit && combo.timeUnit !== 'Unknown' ? combo.timeUnit : '';
                  const notes = combo.notes || '';
                  
                  return (
                    <div key={key} className={`comboCard ${hasError ? 'error' : ''}`}>
                      <div className="comboHeader">
                        <span className="officeBadge">{officeName}</span>
                        <span className="categoryCode">{combo.formCategory || 'General'}</span>
                      </div>
                      <div className="categoryDescription">{categoryLabel}</div>
                      <div className="comboTime">
                        {hasError ? (
                          <span className="errorText">Unavailable</span>
                        ) : (
                          <>
                            <span className="timeValue">{time}</span>
                            {unit && <span className="timeUnit">{unit}</span>}
                          </>
                        )}
                      </div>
                      {notes && (
                        <div className="comboNotes">
                          {notes.split(/\*{2,}/).filter(n => n.trim()).map((paragraph, i) => (
                            <p key={i}>{paragraph.trim()}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Data Archive */}
          <div className="archiveSection" style={{ marginTop: '5rem' }}>
            <div className="sectionHeader">
              <History size={24} />
              <h2>Historical Trend Archive</h2>
            </div>

            <div className="versionTimeline">
              {history.length > 0 ? (
                history.map((version, vIdx) => {
                  const vPayload = version.payload || {};
                  return (
                    <div key={vIdx} className="timelineItem">
                      <div className="timelineDot"></div>
                      <div className="timelineCard historical">
                        <div className="cardHeader">
                          <span className="versionTag">Detected: {new Date(version.detectedAt).toLocaleDateString()}</span>
                          <span className="trendBadge">{vPayload.trend || 'N/A'}</span>
                        </div>
                        <div className="cardContent">
                          <h3>{vPayload.title || version.summary}</h3>
                          <div className="historicalMetrics">
                            <strong>80th Percentile Range:</strong> {vPayload.percentile80 || 'Unknown'}
                          </div>
                          <p className="historicalAnalysis">{vPayload.analysis || version.summary}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="noHistory">No historical data available for {formId}.</div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />

      <SubscribeProcessingTimesModal
        isOpen={modalConfig.isOpen}
        resourceId={formId}
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

// ── Main router component ──
const ProcessingTimesIntel = () => {
  const { formId } = useParams();

  if (formId) {
    return <ProcessingTimesDetail formId={formId} />;
  }

  return <ProcessingTimesLanding />;
};

export default ProcessingTimesIntel;
