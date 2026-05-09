import React from 'react';
import { X, ExternalLink, Calendar, BookOpen, Newspaper, ArrowRight, ShieldCheck } from 'lucide-react';
import './styles.scss';

const ViewIntelModal = ({ isOpen, onClose, item, type = 'policy', onViewAll }) => {
  if (!isOpen || !item) return null;

  const isPolicy = type === 'policy' || type === 'policy-updates';
  const isRelease = type === 'news-releases';
  const isAlert = type === 'newsroom-alerts' || type === 'newsroom';

  const getBadgeLabel = () => {
    if (isPolicy) return 'Policy Manual Update';
    if (isRelease) return 'Official News Release';
    return 'Newsroom Alert';
  };

  const getBadgeIcon = () => {
    if (isPolicy) return <BookOpen size={14} />;
    if (isRelease) return <Newspaper size={14} />;
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
          <div className="targetAgency">USCIS Intelligence Center • Verified Record</div>
        </div>

        <div className="modalBody">
          <div className="analysisSection">
            <div className="sectionLabel">
              <ShieldCheck size={16} />
              <span>{isPolicy ? 'Substantive Legal Impact' : 'Intelligence Summary'}</span>
            </div>
            <div className="analysisText">
              {item.summary}
            </div>
          </div>

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
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="primaryBtn">
              View Source Material <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewIntelModal;
