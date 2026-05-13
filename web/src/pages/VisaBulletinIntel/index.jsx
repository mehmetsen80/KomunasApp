import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  History,
  FileText,
  AlertCircle,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './styles.scss';

const VisaBulletinIntel = () => {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await resourceSyncService.getResourceSyncState('filing-charts', 'visa-bulletin', user?.email);
      setData(result);
    } catch (err) {
      setError('Failed to resolve Visa Bulletin intelligence streams.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="visaBulletinPage loading">
      <div className="spinner"></div>
      <p>Synchronizing Adjustment of Status Filing Charts...</p>
    </div>
  );

  if (error) return (
    <div className="visaBulletinPage error">
      <div className="errorCard">
        <AlertCircle size={48} />
        <h2>Intelligence Disruption</h2>
        <p>{error}</p>
        <button onClick={fetchData}>Retry Synchronization</button>
      </div>
    </div>
  );

  const payload = data?.payload || {};
  const currentMonth = payload.month || 'Current';
  const currentYear = payload.year || '';
  const family = payload.familyDetermination || {};
  const employment = payload.employmentDetermination || {};

  return (
    <div className="visaBulletinPage">
      <Header transparent />
      <div className="pageHeader">
        <div className="container">
          <Link to="/" className="backBtn">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <div className="headerContent">
            <div className="titleArea">
              <h1>Adjustment of Status Filing Charts</h1>
              <p className="subtitle">
                Official USCIS determination for <strong>{currentMonth} {currentYear}</strong> adjustment of status filings.
              </p>
            </div>
            
            <div className="metaInfo">
              <div className="badge">
                <BarChart3 size={14} />
                <span>Visa Availability Priority Dates</span>
              </div>
              <div className="metaItem">
                <Clock size={16} />
                <span>Last Synced: {data?.lastCheckedAt ? new Date(data.lastCheckedAt).toLocaleTimeString() : 'Recent'}</span>
              </div>
              <div className="metaItem">
                <ShieldCheck size={16} />
                <span>Verified USCIS Data Source</span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            {payload.familyDetermination?.url && (
              <a href={payload.familyDetermination.url} target="_blank" rel="noopener noreferrer" className="primaryAction">
                <ExternalLink size={18} /> View Official Bulletin
              </a>
            )}

            <a href="https://www.uscis.gov/visabulletininfo" target="_blank" rel="noopener noreferrer" className="secondaryAction">
              <ExternalLink size={18} /> USCIS Filing Determination
            </a>
            {isAuthenticated && (
              <div className="subscriptionAction">
                {data.subscribed ? (
                  <div className="statusBadge subscribed big">
                    <ShieldCheck size={18} />
                    <span>Subscribed to Alerts</span>
                  </div>
                ) : (
                  <Link to="/" className="subscribeBtnLink">
                    <Bell size={18} />
                    Subscribe to Updates
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="contentSection">
        <div className="container">
          
          <div className="determinationGrid">
            {/* Family-Sponsored Card */}
            <div className="determinationCard family">
              <div className="cardHeader">
                <div className="categoryIcon">
                  <FileText size={24} />
                </div>
                <h3>Family-Sponsored Preference</h3>
              </div>
              <div className="cardBody">
                <div className="chartLabel">REQUIRED CHART:</div>
                <div className="chartValue">{family.chartType || 'Final Action Dates'}</div>
                
                {family.chartType === 'Dates for Filing' ? (
                  payload.familyDatesForFilingTable && (
                    <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: payload.familyDatesForFilingTable }} />
                  )
                ) : (
                  payload.familyFinalActionTable && (
                    <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: payload.familyFinalActionTable }} />
                  )
                )}

                <p className="explanation">
                  You must use the {family.chartType || 'Final Action Dates'} chart to determine when you may file your adjustment of status application this month.
                </p>
              </div>
              {family.url && (
                <div className="cardFooter">
                  <a href={family.url} target="_blank" rel="noopener noreferrer" className="sourceLink">
                    View DOS Bulletin <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            {/* Employment-Based Card */}
            <div className="determinationCard employment">
              <div className="cardHeader">
                <div className="categoryIcon">
                  <BarChart3 size={24} />
                </div>
                <h3>Employment-Based Preference</h3>
              </div>
              <div className="cardBody">
                <div className="chartLabel">REQUIRED CHART:</div>
                <div className="chartValue">{employment.chartType || 'Final Action Dates'}</div>
                
                {employment.chartType === 'Dates for Filing' ? (
                  payload.employmentDatesForFilingTable && (
                    <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: payload.employmentDatesForFilingTable }} />
                  )
                ) : (
                  payload.employmentFinalActionTable && (
                    <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: payload.employmentFinalActionTable }} />
                  )
                )}

                <p className="explanation">
                  You must use the {employment.chartType || 'Final Action Dates'} chart to determine when you may file your adjustment of status application this month.
                </p>
              </div>
              {employment.url && (
                <div className="cardFooter">
                  <a href={employment.url} target="_blank" rel="noopener noreferrer" className="sourceLink">
                    View DOS Bulletin <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="analysisSection">
            <div className="sectionLabel">
              <ShieldCheck size={20} />
              <span>Intelligence Analysis</span>
            </div>
            <div className="analysisText">
              {payload.summary}
            </div>
          </div>

          {payload.highlights && payload.highlights.length > 0 && (
            <div className="highlightsSection">
              <div className="sectionHeader">
                <BarChart3 size={24} />
                <h2>Category Highlights</h2>
              </div>
              <div className="highlightsGrid">
                {payload.highlights.map((h, i) => (
                  <div key={i} className="highlightCard">
                    <div className="cardHeader">
                      <span className="hCategory">{h.category}</span>
                      <span className={`hMovement ${h.movement.toLowerCase().includes('advanced') ? 'positive' : ''}`}>
                        {h.movement}
                      </span>
                    </div>
                    <p className="hAnalysis">{h.analysis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payload.actionableAdvice && (
            <div className="adviceSection">
              <div className="sectionLabel">Actionable Advice</div>
              <div className="adviceText">{payload.actionableAdvice}</div>
            </div>
          )}

          <div className="alertBox">
            <AlertCircle size={20} />
            <div className="alertText">
              <strong>Wait!</strong> If a particular immigrant visa category is “current” on the Final Action Dates chart or the cutoff date on the Final Action Dates chart is later than the date on the Dates for Filing chart, applicants may file using the Final Action Dates chart during that month.
            </div>
          </div>

          <div className="archiveSection">
            <div className="sectionHeader">
              <History size={24} />
              <h2>Historical Determinations</h2>
            </div>
            
            <div className="versionTimeline">
              {data.versionHistory && data.versionHistory.length > 0 ? (
                data.versionHistory.map((version, idx) => (
                  <div key={idx} className="timelineItem">
                    <div className="timelineDot"></div>
                    <div className="timelineCard">
                      <div className="cardHeader">
                        <span className="versionTag">{version.version}</span>
                        <span className="dateTag">{new Date(version.detectedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="cardContent">
                        <p>{version.summary}</p>
                        <div className="miniStats">
                          <span>Family: <strong>{version.payload?.familyDetermination?.chartType}</strong></span>
                          <span>Employment: <strong>{version.payload?.employmentDetermination?.chartType}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noHistory">No historical records in the current pipeline.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VisaBulletinIntel;
