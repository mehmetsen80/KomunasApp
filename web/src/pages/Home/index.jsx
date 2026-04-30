import React from 'react';
import { FileText, Download, ExternalLink, Search, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './styles.scss';
import HeroBackground from '../../components/HeroBackground';
import resourceSyncService from '../../services/resourceSyncService';
import { formatDateTime } from '../../utils/dateUtils';

import Footer from '../../components/Footer';

const Home = () => {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const data = await resourceSyncService.getAllFormStatuses();
        setForms(data);
      } catch (err) {
        setError('Unable to load forms library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredForms = forms.filter(form =>
    form.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homePage" style={{ position: 'relative' }}>
      {/* ── Top-right Login (Hidden for now) ──
      <div className="topBar">
        <Link to="/login" className="loginBtn">
          <LogIn size={18} />
          Login
        </Link>
      </div>
      */}

      {/* ── Hero Section ── */}
      <section className="hero">
        {/* Hero background SVG */}
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
                    <Link to={`/form/${form.id}`} className="formId">{form.id}</Link>
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
                    <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="downloadBtn">
                      <Download size={16} /> PDF
                    </a>
                    <a href={form.instrUrl} target="_blank" rel="noopener noreferrer" className="downloadBtn">
                      <Download size={16} /> Instr
                    </a>
                    <Link to={`/form/${form.id}`} className="viewLink">
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
    </div>
  );
};

export default Home;
