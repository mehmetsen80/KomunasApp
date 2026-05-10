import React from 'react';
import { X, ExternalLink, Calendar, BookOpen, Newspaper, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';
import './styles.scss';

const ViewIntelModal = ({ isOpen, onClose, item, type = 'policy', onViewAll }) => {
  if (!isOpen || !item) return null;

  const isPolicy = type === 'policy' || type === 'policy-updates';
  const isRelease = type === 'news-releases';
  const isAlert = type === 'newsroom-alerts' || type === 'newsroom';
  const isVisa = type === 'visa-bulletin';

  const getBadgeLabel = () => {
    if (isPolicy) return 'Policy Manual Update';
    if (isRelease) return 'Official News Release';
    if (isVisa) return 'Visa Bulletin Analysis';
    return 'Newsroom Alert';
  };

  const getBadgeIcon = () => {
    if (isPolicy) return <BookOpen size={14} />;
    if (isRelease) return <Newspaper size={14} />;
    if (isVisa) return <BarChart3 size={14} />;
    return <Newspaper size={14} />;
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent viewIntelModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="headerTop">
            <div className={`typeBadge ${type}`}>
              {getBadgeIcon()}
              <span>{getBadgeLabel()}</span>
            </div>
            <div className="dateBadge">
              <Calendar size={14} />
              <span>{item.date}</span>
            </div>
          </div>
          <h2>{item.title}</h2>
          <div className="targetAgency">
            {isVisa ? 'Department of State & USCIS Intelligence' : 'USCIS Intelligence Center • Verified Record'}
          </div>
        </div>

        <div className="modalBody">
          {isVisa && item.determination && (
            <div className="determinationBox">
              <div className="boxLabel">USCIS Filing Determination:</div>
              <div className="boxValue">{item.determination}</div>
            </div>
          )}

          <div className="analysisSection">
            <div className="sectionLabel">
              <ShieldCheck size={16} />
              <span>{isVisa ? 'Intelligence Analysis' : (isPolicy ? 'Substantive Legal Impact' : 'Intelligence Summary')}</span>
            </div>
            <div className="analysisText">
              {item.summary}
            </div>
          </div>

          {isVisa && item.highlights && item.highlights.length > 0 && (
            <div className="highlightsSection">
              <div className="sectionLabel">Category Highlights:</div>
              <div className="highlightsList">
                {item.highlights.map((h, i) => (
                  <div key={i} className="highlightItem">
                    <div className="highlightHeader">
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

          {isVisa && item.actionableAdvice && (
            <div className="adviceSection">
              <div className="sectionLabel">Actionable Advice:</div>
              <div className="adviceText">{item.actionableAdvice}</div>
            </div>
          )}

          {isVisa && item.familyDetermination && (
            <div className="bulletinSection">
              <div className="sectionLabel">Family-Sponsored Preference: {item.familyDetermination.chartType}</div>
              {item.familyDetermination.chartType === 'Dates for Filing' ? (
                item.familyDatesForFilingTable && (
                  <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: item.familyDatesForFilingTable }} />
                )
              ) : (
                item.familyFinalActionTable && (
                  <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: item.familyFinalActionTable }} />
                )
              )}
            </div>
          )}

          {isVisa && item.employmentDetermination && (
            <div className="bulletinSection" style={{ marginTop: '2rem' }}>
              <div className="sectionLabel">Employment-Based Preference: {item.employmentDetermination.chartType}</div>
              {item.employmentDetermination.chartType === 'Dates for Filing' ? (
                item.employmentDatesForFilingTable && (
                  <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: item.employmentDatesForFilingTable }} />
                )
              ) : (
                item.employmentFinalActionTable && (
                  <div className="bulletinTableWrapper SovereignTable" dangerouslySetInnerHTML={{ __html: item.employmentFinalActionTable }} />
                )
              )}
            </div>
          )}

          {isPolicy && item.chapters && item.chapters.length > 0 && (
            <div className="chaptersSection">
              <div className="sectionLabel">Affected Chapters:</div>
              <div className="chaptersList">
                {item.chapters.map((ch, i) => (
                  ch.url ? (
                    <a key={i} href={ch.url} target="_blank" rel="noopener noreferrer" className="miniChapter clickable">
                      {ch.title} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span key={i} className="miniChapter">{ch.title}</span>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modalFooter">
          <button className="secondaryBtn" onClick={onViewAll}>
            View Full Timeline <ArrowRight size={16} />
          </button>
          
          <div className="footerActions">
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="primaryBtn">
                View Official Bulletin <ExternalLink size={16} />
              </a>
            )}
            {type === 'visa-bulletin' && (
              <a href="https://www.uscis.gov/visabulletininfo" target="_blank" rel="noopener noreferrer" className="secondaryBtn outline">
                USCIS Determination <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewIntelModal;
