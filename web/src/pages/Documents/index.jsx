import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  FileCode,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import axiosInstance from '../../services/axiosInstance';
import { formatDateTime } from '../../utils/dateUtils';
import './styles.scss';

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formsList = await resourceSyncService.getAllFormStatuses(user?.email);
      const docsList = [];

      formsList.forEach(form => {
        // 1. Form PDF
        if (form.pdfUrl) {
          docsList.push({
            id: `form-${form.id}-pdf`,
            formId: form.id,
            name: `${form.id} Form (PDF)`,
            description: form.displayName || 'Official USCIS Petition Form.',
            type: 'form',
            format: 'PDF',
            url: form.pdfUrl,
            documentId: form.documentId,
            changeDetected: form.changeDetected,
            lastCheckedAt: form.lastCheckedAt
          });
        }

        // 2. Instructions PDF/HTML
        if (form.instrUrl) {
          const isPdf = form.instrUrl.toLowerCase().endsWith('.pdf');
          docsList.push({
            id: `form-${form.id}-instructions`,
            formId: form.id,
            name: `${form.id} Instructions`,
            description: `Official instructions guide and filing procedures for Form ${form.id}.`,
            type: 'instructions',
            format: isPdf ? 'PDF' : 'Web View',
            url: form.instrUrl,
            documentId: form.instructionsDocumentId,
            changeDetected: form.changeDetected,
            lastCheckedAt: form.lastCheckedAt
          });
        }
      });

      // Sort alphabetically by form ID
      docsList.sort((a, b) => a.formId.localeCompare(b.formId));
      setDocuments(docsList);
    } catch (err) {
      console.error('Failed to compile document assets:', err);
      setError('Unable to synchronize the document repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user?.email]);



  const handleLinqraDownload = async (doc) => {
    if (!doc.documentId) {
      return; // Button should not be visible without a documentId
    }

    try {
      // Call the KomunasApp backend proxy endpoint which handles auth via LinqraClient
      const response = await axiosInstance.get(`/api/linqra/documents/${doc.documentId}/download`, {
        responseType: 'blob',
        timeout: 300000,
        headers: {
          'Accept': '*/*'
        }
      });

      // Extract filename from response header
      const contentDisposition = response.headers['content-disposition'];
      let fileName;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=([^;\n]+)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
          try {
            fileName = decodeURIComponent(fileName);
          } catch (e) {
            // Use as-is
          }
        }
      }
      if (!fileName) {
        const extension = doc.format.toLowerCase() === 'pdf' ? '.pdf' : '';
        fileName = `${doc.name.replace(/\s+/g, '_')}${extension}`;
      }

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
    } catch (err) {
      console.error('Linqra download failed:', err);
      alert('Download failed. Please try again later.');
    }
  };


  // Compute stat metrics
  const totalCount = documents.length;
  const formsCount = documents.filter(d => d.type === 'form').length;
  const instructionsCount = documents.filter(d => d.type === 'instructions').length;

  // Filter lists
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.formId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = 
      selectedType === 'all' || 
      doc.type === selectedType;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="documentsLoading">
        <div className="loadingSpinner"></div>
        <span>Synchronizing document repository indices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documentsPage error">
        <div className="errorCard">
          <AlertCircle size={48} />
          <h2>Index Sync Failed</h2>
          <p>{error}</p>
          <button onClick={loadDocuments}>Re-sync Repository</button>
        </div>
      </div>
    );
  }

  return (
    <div className="documentsPage">
      {/* Header */}
      <div className="documentsHeader">
        <div className="documentsHeading">
          <h1 className="documentsTitle">USCIS Document Library</h1>
          <p className="documentsSubtitle">
            Quick access to official USCIS petition form PDFs and standard instruction filing manuals.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="documentsStats">
        <div className="statCard">
          <div className="statIcon">
            <FileText size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Total Files</span>
            <span className="statValue">{totalCount}</span>
          </div>
        </div>
        
        <div className="statCard">
          <div className="statIcon">
            <FileCode size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Form PDFs</span>
            <span className="statValue">{formsCount}</span>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">
            <ShieldCheck size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Filing Guides</span>
            <span className="statValue">{instructionsCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="documentsFilterBar">
        <div className="searchBox">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            className="searchInput"
            placeholder="Search documents by form code, title, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filterControls">
          <div className="tabs">
            <button 
              className={`tabBtn ${selectedType === 'all' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              All Assets
            </button>
            <button 
              className={`tabBtn ${selectedType === 'form' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedType('form')}
            >
              Forms (PDF)
            </button>
            <button 
              className={`tabBtn ${selectedType === 'instructions' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedType('instructions')}
            >
              Instructions
            </button>
          </div>
        </div>
      </div>

      {/* Documents Table/Grid List */}
      {filteredDocs.length > 0 ? (
        <div className="documentsTableWrapper">
          <table className="documentsTable">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Resource ID</th>
                <th>Format</th>
                <th>Linqra Cache</th>
                <th>Linqra Download</th>
                <th>Last Checked</th>
                <th className="textRight">USCIS Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="documentRow">
                  <td className="docCell">
                    <div className="docIconWrapper">
                      <FileText size={20} className={doc.type === 'form' ? 'formIconColor' : 'instrIconColor'} />
                    </div>
                    <div className="docDetails">
                      <span 
                        onClick={() => navigate('/sources')} 
                        className="docName"
                        title="Go to Sources page"
                      >
                        {doc.name}
                      </span>
                      <span className="docDesc">{doc.description}</span>
                    </div>
                  </td>
                  <td>
                    <span className="docFormIdBadge">{doc.formId}</span>
                  </td>
                  <td>
                    <span className={`formatLabel ${doc.format.toLowerCase() === 'pdf' ? 'pdf' : 'html'}`}>
                      {doc.format}
                    </span>
                  </td>
                  <td>
                    {doc.documentId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {doc.changeDetected ? (
                          <div className="khSyncStatus khSyncStatus--warning" title="A newer version was detected on USCIS; local cache update is pending.">
                            <span className="syncIndicator"></span>
                            <span className="syncLabel">Update Pending</span>
                          </div>
                        ) : (
                          <div className="khSyncStatus khSyncStatus--synced">
                            <span className="syncIndicator"></span>
                            <span className="syncLabel">Synced</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="khSyncStatus khSyncStatus--pending" title="Document is not synchronized to local server cache">
                        <span className="syncIndicator"></span>
                        <span className="syncLabel">USCIS Only</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {doc.documentId && (
                      <button
                        onClick={() => handleLinqraDownload(doc)}
                        className="btnAction btnAction--linqra"
                        title="Download from Linqra Cache"
                      >
                        <Download size={13} /> Download
                      </button>
                    )}
                  </td>
                  <td>
                    <span className="checkedDate">
                      <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle', opacity: 0.6 }} />
                      {formatDateTime(doc.lastCheckedAt)}
                    </span>
                  </td>
                  <td className="actionsCell">
                    <div className="rowActions">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btnAction btnAction--uscis"
                        title="View original document on USCIS website"
                      >
                        <Download size={14} /> Download
                      </a>
                      

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="documentsEmptyCard">
          <Search size={48} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
          <h3>No documents match your query</h3>
          <p>Double-check your spelling, search for a form ID (e.g. I-130), or reset filters to explore.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
            }}
            className="clearFiltersBtn"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Documents;
