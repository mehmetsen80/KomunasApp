import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Brain, Globe, ArrowRight, Play, Layers, Clock, BookOpen, FileText, CheckCircle, Lock, Bell, Scale, Briefcase, Users, X, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VideoDemoModal from '../../components/Modals/VideoDemoModal';
import RequestDemoModal from '../../components/Modals/RequestDemoModal';
import './styles.scss';

const PREVIEW_IMAGES = [
  { src: '/dashboard-preview.png', alt: 'Dashboard Overview', label: 'Overview Dashboard' },
  { src: '/sources-preview.png',   alt: 'Monitored Sources',   label: 'Monitored Sources' },
  { src: '/subscribe-preview.png', alt: 'Subscription Modal',  label: 'Form Subscription' },
  { src: '/documents-preview.png', alt: 'Documents Library',  label: 'Document Library' },
  { src: '/aiagents-preview.png',  alt: 'AI Agents Panel',     label: 'AI Agents Panel' },
];

const FEATURES = [
  {
    icon: <Shield size={22} />,
    title: 'Early Detection',
    desc: 'Detect regulatory changes before they impact you.',
  },
  {
    icon: <Brain size={22} />,
    title: 'AI-Powered Analysis',
    desc: 'Understand what changed and why it matters.',
  },
  {
    icon: <Bell size={22} />,
    title: 'Actionable Alerts',
    desc: 'Get notified and take action with confidence.',
  },
  {
    icon: <Globe size={22} />,
    title: 'Full Coverage',
    desc: 'Monitor all critical sources in real time.',
  },
];




const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const audienceRef = useRef(null);
  const sourcesRef = useRef(null);
  const securityRef = useRef(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % PREVIEW_IMAGES.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + PREVIEW_IMAGES.length) % PREVIEW_IMAGES.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextImage();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Authenticated users should not see this page — redirect handled in AppRoutes
  if (isAuthenticated) {
    navigate('/overview', { replace: true });
    return null;
  }

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAudience = () => {
    audienceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSources = () => {
    sourcesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSecurity = () => {
    securityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landingPage">
      {/* ── Top Navigation ── */}
      <nav className={`landingNav ${isMobileMenuOpen ? 'mobileMenuOpen' : ''}`}>
        <div className="navInner">
          <Link to="/" className="navBrand" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="brandMark">K</div>
            <div className="brandText">
              <span className="brandName">Komunas</span>
              <span className="brandSub">Regulatory Intelligence</span>
            </div>
          </Link>

          <div className="navLinks">
            <button className="navLink" onClick={scrollToFeatures}>Features</button>
            <button className="navLink" onClick={scrollToAudience}>Who it's for</button>
            <button className="navLink" onClick={scrollToSources}>Monitored Sources</button>
            <button className="navLink" onClick={scrollToSecurity}>Security</button>
          </div>

          <div className="navActions">
            <Link to="/login" className="navLogin">Log in</Link>
            <button className="navCta" onClick={() => { setIsMobileMenuOpen(false); setIsDemoModalOpen(true); }}>
              <span className="ctaTextLong">Request a </span>Demo <ArrowRight size={15} />
            </button>
            
            <button 
              className="mobileMenuToggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mobileNavDropdown">
            <button className="mobileNavLink" onClick={() => { setIsMobileMenuOpen(false); scrollToFeatures(); }}>Features</button>
            <button className="mobileNavLink" onClick={() => { setIsMobileMenuOpen(false); scrollToAudience(); }}>Who it's for</button>
            <button className="mobileNavLink" onClick={() => { setIsMobileMenuOpen(false); scrollToSources(); }}>Monitored Sources</button>
            <button className="mobileNavLink" onClick={() => { setIsMobileMenuOpen(false); scrollToSecurity(); }}>Security</button>
            <div className="mobileNavDivider" />
            <div className="mobileNavFooter">
              <Link to="/login" className="mobileNavLogin" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              <button className="mobileNavCta" onClick={() => { setIsMobileMenuOpen(false); setIsDemoModalOpen(true); }}>
                Request a Demo <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="heroInner">
          {/* Left Column — headline + CTAs */}
          <div className="heroLeft">
            <div className="heroBadge">
              <span>✦</span>
              <span>AI-POWERED REGULATORY INTELLIGENCE</span>
              <span>✦</span>
            </div>

            <h1 className="heroTitle">
              Stay Ahead of USCIS<br />
              Changes <span className="accentText">That Matter</span>
            </h1>

            <p className="heroDesc">
              Komunas monitors, analyzes, and alerts you about regulatory
              changes across critical sources—so you can act early,
              stay compliant, and reduce risk.
            </p>

            <div className="heroCtas">
              <button className="ctaPrimary" onClick={() => setIsDemoModalOpen(true)}>
                Request a Demo <ArrowRight size={16} />
              </button>
              {/* <button className="ctaSecondary" onClick={() => setIsVideoModalOpen(true)}>
                <Play size={14} className="playIcon" />
                See How It Works
              </button> */}
            </div>
          </div>

          {/* Right Column — Feature Pillars */}
          <div className="heroRight" ref={featuresRef}>
            <div className="featurePillars">
              {FEATURES.map((f) => (
                <div key={f.title} className="pillar">
                  <div className="pillarIcon">{f.icon}</div>
                  <div className="pillarText">
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full-Width Dashboard Preview Row (Carousel) */}
        <div className="heroDashRow">
          <div className="carouselContainer">
            {/* Main Active Image Wrapper */}
            <div 
              className="dashPreviewWrapper" 
              onClick={() => setIsPreviewOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={PREVIEW_IMAGES[activeImageIndex].src}
                alt={`${PREVIEW_IMAGES[activeImageIndex].alt} (Click to expand)`}
                className="dashPreviewImg"
              />
              
              {/* Left/Right Arrow Overlays */}
              <button 
                className="carouselArrow arrowLeft" 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="carouselArrow arrowRight" 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Slide Indicators / Tabs */}
            <div className="carouselIndicators">
              {PREVIEW_IMAGES.map((img, idx) => (
                <button
                  key={img.src}
                  className={`indicatorTab ${idx === activeImageIndex ? 'activeTab' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                >
                  <span className="indicatorDot" />
                  <span className="indicatorLabel">{img.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Target Audience Section ── */}
      <section className="landingAudience" ref={audienceRef}>
        <div className="sectionHeader">
          <div className="sectionBadge">Target Audience</div>
          <h2>Who is Komunas for?</h2>
          <p>
            Komunas provides dedicated regulatory monitoring and early warning alerts tailored for teams managing high-stakes immigration compliance.
          </p>
        </div>

        <div className="audienceGrid">
          <div className="audienceCard">
            <div className="cardIcon"><Scale size={22} /></div>
            <h3>Immigration Law Firms</h3>
            <p>
              Automatically track form updates, policy manual revisions, and monthly visa bulletins. Prevent rejected filings and keep client applications on track without manual website checking.
            </p>
          </div>

          <div className="audienceCard">
            <div className="cardIcon"><Users size={22} /></div>
            <h3>Global Mobility &amp; HR</h3>
            <p>
              Monitor wait-time backlogs across all USCIS service centers. Forecast employee visa timelines (H-1B, L-1, Green Cards) and maintain seamless communications with international hires.
            </p>
          </div>

          <div className="audienceCard">
            <div className="cardIcon"><Briefcase size={22} /></div>
            <h3>Legal &amp; Compliance Teams</h3>
            <p>
              Receive instant alerts on critical regulatory events and policy modifications. Access detailed impact analysis reports to keep your organization aligned and audit-ready.
            </p>
          </div>
        </div>
      </section>

      {/* ── Monitored Sources Showcase Section ── */}
      <section className="landingSources" ref={sourcesRef}>
        <div className="sectionHeader">
          <div className="sectionBadge">REAL-TIME FEEDS</div>
          <h2>USCIS Monitored Streams</h2>
          <p>
            We actively monitor the following regulatory categories, indexing and analyzing
            revisions the moment they are updated by the agency.
          </p>
        </div>

        <div className="sourcesShowcaseGrid">
          <div className="sourceShowcaseCard">
            <div className="cardIcon"><FileText size={22} /></div>
            <h3>USCIS Forms Library</h3>
            <p>Monitors PDF document updates, instructions additions, and fee changes for Forms like I-129, I-140, I-485, and I-765.</p>
          </div>

          <div className="sourceShowcaseCard">
            <div className="cardIcon"><Clock size={22} /></div>
            <h3>Processing Wait Times</h3>
            <p>Tracks backlog processing intervals across all USCIS field offices and service centers to forecast processing timelines.</p>
          </div>

          <div className="sourceShowcaseCard">
            <div className="cardIcon"><Bell size={22} /></div>
            <h3>Announcements & News</h3>
            <p>Scans USCIS alerts, newsroom releases, and temporary policy statements for immediate regulatory actions.</p>
          </div>

          <div className="sourceShowcaseCard">
            <div className="cardIcon"><BookOpen size={22} /></div>
            <h3>Policy Manual Updates</h3>
            <p>Indexes substantive revisions to the official USCIS Policy Manual to keep legal compliance aligned with agency directives.</p>
          </div>

          <div className="sourceShowcaseCard">
            <div className="cardIcon"><Globe size={22} /></div>
            <h3>Visa Bulletin Charts</h3>
            <p>Checks monthly DOS adjustment charts to verify filing status determinations and green card eligibility windows.</p>
          </div>

          <div className="sourceShowcaseCard">
            <div className="cardIcon"><Layers size={22} /></div>
            <div className="cardHeaderRow">
              <h3>Federal Register Notices</h3>
              <span className="comingSoonBadge">Coming Soon</span>
            </div>
            <p>Monitors daily federal publications, proposed rule revisions, and public notices impacting immigration policies.</p>
          </div>
        </div>
      </section>

      {/* ── Security & Workspace Integration Section ── */}
      <section className="landingSecurity" ref={securityRef}>
        <div className="securityInner">
          <div className="securityLeft">
            <div className="sectionBadge">COMPLIANCE & RISK</div>
            <h2>Enterprise-Grade Security</h2>
            <p>
              Komunas is engineered on a resilient zero-trust architecture, ensuring all team
              workspace assignments and data-sync integrations remain protected.
            </p>

            <div className="securityFeaturesList">
              <div className="securityFeatureItem">
                <div className="checkIcon"><CheckCircle size={18} /></div>
                <div>
                  <strong>Federated Authentication</strong>
                  <span>Scopes and user authentication are secured via OIDC and OAuth2 protocols.</span>
                </div>
              </div>

              <div className="securityFeatureItem">
                <div className="checkIcon"><CheckCircle size={18} /></div>
                <div>
                  <strong>Linqra Gateway Synchronization</strong>
                  <span>Bidirectional gateway mapping guarantees clean organizational boundaries and data isolation.</span>
                </div>
              </div>

              <div className="securityFeatureItem">
                <div className="checkIcon"><CheckCircle size={18} /></div>
                <div>
                  <strong>Registry Activity Audit</strong>
                  <span>Automated tracking of team assignments, document downloads, and user settings changes.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="securityRight">
            <div className="securityMockCard">
              <div className="cardHeader">
                <Lock size={20} />
                <span>Security Integrity Status</span>
              </div>
              <div className="cardBody">
                <div className="statusRow">
                  <span>Linqra Client Connection</span>
                  <span className="statusOk">Connected</span>
                </div>
                <div className="statusRow">
                  <span>OIDC Identity Provider</span>
                  <span className="statusOk">Active</span>
                </div>
                <div className="statusRow">
                  <span>Workspace Isolation</span>
                  <span className="statusOk">Enforced</span>
                </div>
                <div className="statusRow">
                  <span>Database Encryption</span>
                  <span className="statusOk">TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Landing Footer ── */}
      <footer className="landingFooter">
        <p>© {new Date().getFullYear()} Komunas. Advanced Regulatory Intelligence & Linqra Integration.</p>
      </footer>

      {/* ── Video Player Modal ── */}
      <VideoDemoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />

      {/* ── Request Demo Modal ── */}
      <RequestDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* ── Dashboard Image Lightbox Modal ── */}
      {isPreviewOpen && (
        <div className="previewLightboxOverlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="lightboxContent" onClick={(e) => e.stopPropagation()}>
            <button className="lightboxCloseBtn" onClick={() => setIsPreviewOpen(false)} aria-label="Close preview">
              <X size={26} />
            </button>
            <img
              src={PREVIEW_IMAGES[activeImageIndex].src}
              alt={`${PREVIEW_IMAGES[activeImageIndex].alt} Fullscreen`}
              className="lightboxImg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
