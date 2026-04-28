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
  Calendar
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import './styles.scss';

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await resourceSyncService.getFormStatus(id);
        setForm(data);
      } catch (err) {
        setError('Unable to load form details. The resource might not exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

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
      <nav className="detailNav">
        <button onClick={() => navigate('/')} className="backBtn">
          <ArrowLeft size={20} />
          Back to Library
        </button>
      </nav>

      <header className="detailHero">
        <div className="heroContent">
          <div className="formTypeBadge">USCIS {form.resourceCategory}</div>
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
          </div>
        </div>
      </header>

      <main className="detailContent">
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
                <div key={index} className="timelineItem">
                  <div className="timelineDot"></div>
                  <div className="timelineCard">
                    <div className="cardHeader">
                      <span className="versionTag">v{entry.version}</span>
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
    </div>
  );
};

export default FormDetail;
