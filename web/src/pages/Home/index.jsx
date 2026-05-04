import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, Search, LogIn, UserPlus, LogOut,
  User as UserIcon, Bell, BellOff, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles.scss';
import HeroBackground from '../../components/HeroBackground';
import resourceSyncService from '../../services/resourceSyncService';
import { formatDateTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import SubscribeConfirmModal from '../../components/Modals/SubscribeConfirmModal';

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    formId: null, 
    domain: null,
    category: null,
    isUnsubscribing: false, 
    subscriptionId: null 
  });

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        // Use user email as userId for subscription check
        const data = await resourceSyncService.getAllFormStatuses(user?.email);
        setForms(data);
      } catch (err) {
        setError('Unable to load forms library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user?.email]);

  const refreshData = async () => {
    try {
      const data = await resourceSyncService.getAllFormStatuses(user?.email);
      setForms(data);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleSubscriptionSuccess = () => {
    const { formId, isUnsubscribing } = modalConfig;

    // Optimistic update to prevent the "flip-back" effect
    setForms(prev => prev.map(f => {
      if (f.id === formId) {
        return { ...f, subscribed: !isUnsubscribing };
      }
      return f;
    }));

    // Refresh the real data after a short delay to allow propagation
    setTimeout(refreshData, 1500);
  };

  const openSubscribeModal = (formId, domain, category) => {
    if (!isAuthenticated) return;
    setModalConfig({ isOpen: true, formId, domain, category, isUnsubscribing: false, subscriptionId: null });
  };

  const openUnsubscribeModal = (formId, domain, category, subscriptionId) => {
    setModalConfig({ isOpen: true, formId, domain, category, isUnsubscribing: true, subscriptionId });
  };

  const filteredForms = forms
    .filter(form =>
      form.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Prioritize changeDetected: true
      if (a.changeDetected && !b.changeDetected) return -1;
      if (!a.changeDetected && b.changeDetected) return 1;
      // Secondary sort by ID
      return a.id.localeCompare(b.id);
    });

  return (
    <div className="homePage" style={{ position: 'relative' }}>
      <Header transparent />

      {/* ── Hero Section ── */}
      <section className="hero">
        <HeroBackground />
        <div className="logoContainer">
          <img src="/logo.jpg" alt="Komunas Logo" />
          <div className="shineEffect"></div>
        </div>
        <div className="tagline">
          <span>Struggling to keep up with USCIS changes?</span>
          <strong>Never miss a new form or regulation again.</strong>
        </div>
        <h1>USCIS Forms Library</h1>
        <p>Direct access to the latest form versions and instructions.</p>
        <div className="searchWrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search USCIS forms by ID or name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* ── Forms Grid ── */}
      <main className="formsGrid">
        <div className="sectionHeader">
          <h2>Monitored Forms</h2>
          <div className="countBadge">{filteredForms.length} Forms</div>
        </div>
        {loading && (
          <div className="loadingState">
            <div className="spinner"></div>
            <p>Synchronizing with USCIS records...</p>
          </div>
        )}

        {error && (
          <div className="errorState">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="gridContainer">
            {filteredForms.length === 0 && (
              <div className="emptyState">
                <p>{searchTerm ? `No forms matching "${searchTerm}" found.` : 'No forms currently monitored. Check back soon.'}</p>
              </div>
            )}
            {filteredForms.map(form => (
              <div key={form.id} className="formCard">
                <div className="formIcon">
                  <FileText size={24} />
                </div>
                <div className="formDetails">
                  <div className="formHeader">
                    <div className="idWrapper">
                      <Link to={`/form/${form.id}`} className="formId">{form.id}</Link>
                      {form.changeDetected && (
                        <span className="criticalBadge">
                          <AlertTriangle size={12} />
                          CRITICAL CHANGE
                        </span>
                      )}
                    </div>
                    <span className="formVersion">v{form.version}</span>
                  </div>
                  <h3 className="formName">
                    <Link to={`/form/${form.id}`}>{form.name}</Link>
                  </h3>
                  <div className="formMeta">
                    <span className="lastChecked">
                      Last checked: {formatDateTime(form.lastCheckedAt)}
                    </span>
                  </div>
                  <div className="formActions">
                    <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="downloadBtn" title="Download Form">
                      <Download size={16} /> PDF
                    </a>
                    <a href={form.instrUrl} target="_blank" rel="noopener noreferrer" className="downloadBtn" title="Download Instructions">
                      <Download size={16} /> Instr
                    </a>

                    {isAuthenticated && (
                      <div className="subscriptionAction">
                        {form.subscribed ? (
                          <button
                            className="subscribedBtn"
                            onClick={() => openUnsubscribeModal(form.id, form.domain, form.category, form.subscriptionId)}
                            disabled={submittingId === form.id}
                            title="Unsubscribe from updates"
                          >
                            {submittingId === form.id ? <div className="mini-spinner"></div> : <CheckCircle size={16} />}
                            Subscribed
                          </button>
                        ) : (
                          <button
                            className="subscribeBtn"
                            onClick={() => openSubscribeModal(form.id, form.domain, form.category)}
                            disabled={submittingId === form.id}
                            title="Subscribe to updates"
                          >
                            {submittingId === form.id ? <div className="mini-spinner"></div> : <Bell size={16} />}
                            Subscribe
                          </button>
                        )}
                      </div>
                    )}

                    <Link to={`/form/${form.id}`} className="viewLink" title="View Details">
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <SubscribeConfirmModal
        isOpen={modalConfig.isOpen}
        formId={modalConfig.formId}
        domain={modalConfig.domain}
        category={modalConfig.category}
        userEmail={user?.email}
        subscriptionId={modalConfig.subscriptionId}
        isUnsubscribing={modalConfig.isUnsubscribing}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default Home;
