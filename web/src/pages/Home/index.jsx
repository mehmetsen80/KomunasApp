import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, FileText, Download, ExternalLink, Search,
  Bell, CheckCircle, AlertTriangle, Rss, BookOpen, BarChart3,
  Shield, Clock, ArrowRight, AlertCircle, CheckCircle2, Filter, Newspaper,
  User, LogOut, LogIn, UserPlus, Menu, X, ChevronDown, Activity, Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './styles.scss';
import HeroBackground from '../../components/HeroBackground';
import resourceSyncService from '../../services/resourceSyncService';
import { formatDateTime, formatSyncTime, getRelativeTime } from '../../utils/dateUtils';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { useNavigate as useNav } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SubscribeFormModal from '../../components/Modals/SubscribeFormModal';
import ViewIntelModal from '../../components/Modals/ViewIntelModal';
import LogoutConfirmationModal from '../../components/Modals/LogoutConfirmationModal';
import notificationService from '../../services/notificationService';
import DataToolTip from '../../components/DataToolTip';

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [viewModal, setViewModal] = useState({ isOpen: false, item: null, type: 'policy' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHeaderUserMenuOpen, setIsHeaderUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const headerUserMenuRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [newsroomAlerts, setNewsroomAlerts] = useState([]);
  const [newsroomData, setNewsroomData] = useState(null);
  const [newsReleases, setNewsReleases] = useState([]);
  const [newsReleasesData, setNewsReleasesData] = useState(null);
  const [policyUpdates, setPolicyUpdates] = useState([]);
  const [policyData, setPolicyData] = useState(null);
  const [visaBulletinData, setVisaBulletinData] = useState(null);
  const [processingTimes, setProcessingTimes] = useState([]);
  const [newsroomLoading, setNewsroomLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const count = await notificationService.getUnreadCount(user.email.toLowerCase());
          setUnreadCount(count);
        } catch (err) {
          console.error('Failed to fetch unread count:', err);
        }
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

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

    const fetchNewsroom = async () => {
      try {
        setNewsroomLoading(true);

        // Fetch Announcements
        const alertsData = await resourceSyncService.getNewsroomStatus('newsroom-alerts', user?.email);
        setNewsroomData(alertsData);
        setNewsroomAlerts(alertsData?.payload?.alerts?.slice(0, 3) || []);

        // Fetch News Releases
        const releasesData = await resourceSyncService.getNewsroomStatus('news-releases', user?.email);
        setNewsReleasesData(releasesData);
        setNewsReleases(releasesData?.payload?.alerts?.slice(0, 3) || []);

        // Fetch Policy Manual Updates
        const pData = await resourceSyncService.getPolicyManualStatus('policy-updates', user?.email);
        setPolicyData(pData);
        setPolicyUpdates(pData?.payload?.updates?.slice(0, 3) || []);

        // Fetch Visa Bulletin Determination
        const vData = await resourceSyncService.getVisaBulletinStatus('filing-charts', user?.email);
        setVisaBulletinData(vData);

        // Fetch Processing Times Updates
        const ptData = await resourceSyncService.getAllProcessingTimesStatuses(user?.email);
        setProcessingTimes(ptData?.slice(0, 3) || []);

      } catch (err) {
        console.error('Failed to load newsroom/policy data:', err);
      } finally {
        setNewsroomLoading(false);
      }
    };

    fetchForms();
    fetchNewsroom();
  }, [user?.email]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (headerUserMenuRef.current && !headerUserMenuRef.current.contains(event.target)) {
        setIsHeaderUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsHeaderUserMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

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

  const syncStatus = React.useMemo(() => {
    const getLatest = (items) => {
      if (!items || items.length === 0) return null;
      return Math.max(...items.map(f => new Date(f.lastCheckedAt).getTime()));
    };

    return {
      forms: getLatest(forms),
      newsroom: newsroomData?.lastCheckedAt ? new Date(newsroomData.lastCheckedAt).getTime() : null,
      releases: newsReleasesData?.lastCheckedAt ? new Date(newsReleasesData.lastCheckedAt).getTime() : null,
      policy: policyData?.lastCheckedAt ? new Date(policyData.lastCheckedAt).getTime() : null,
      bulletin: visaBulletinData?.lastCheckedAt ? new Date(visaBulletinData.lastCheckedAt).getTime() : null,
      processing: processingTimes.length > 0 ? Math.max(...processingTimes.map(pt => new Date(pt.lastCheckedAt).getTime())) : null,
    };
  }, [forms, newsroomData, newsReleasesData, policyData, visaBulletinData, processingTimes]);

  const lastSyncTime = React.useMemo(() => {
    const times = Object.values(syncStatus).filter(t => t !== null);
    const maxTime = times.length > 0 ? Math.max(...times) : null;
    return maxTime ? formatDateTime(maxTime) : 'Just now';
  }, [syncStatus]);

  const monitoredStats = React.useMemo(() => {
    let count = forms.filter(f => f.subscribed).length;
    count += processingTimes.filter(pt => pt.subscribed).length;
    if (newsroomData?.subscribed) count++;
    if (newsReleasesData?.subscribed) count++;
    if (policyData?.subscribed) count++;
    if (visaBulletinData?.subscribed) count++;

    const allItems = [
      ...newsroomAlerts.map(a => new Date(a.date).getTime()),
      ...newsReleases.map(a => new Date(a.date).getTime()),
      ...policyUpdates.map(a => new Date(a.date).getTime()),
      ...processingTimes.map(pt => new Date(pt.lastUpdatedAt).getTime())
    ].filter(t => !isNaN(t));

    // For Visa Bulletin, use its month/year as a proxy for date if payload exists
    if (visaBulletinData?.payload?.month && visaBulletinData?.payload?.year) {
      const vDate = new Date(`${visaBulletinData.payload.month} 1, ${visaBulletinData.payload.year}`).getTime();
      if (!isNaN(vDate)) allItems.push(vDate);
    }

    const latestItemDate = allItems.length > 0 ? Math.max(...allItems) : null;

    return {
      count,
      latestDate: latestItemDate ? new Date(latestItemDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
    };
  }, [forms, newsroomData, newsReleasesData, policyData, visaBulletinData, processingTimes, newsroomAlerts, newsReleases, policyUpdates]);

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

      {/* ── Hero Section ── */}
      <section className={`hero ${isMenuOpen ? 'menuOpen' : ''}`}>
        <HeroBackground />
        <div className="heroNav">
          <div className="heroNavInner">
            <div className="heroNavLeft">
              <Link to="/" className="heroNavLogo" onClick={() => setIsMenuOpen(false)}>
                <img src="/icon.jpg" alt="Komunas" />
                <span>Komunas</span>
              </Link>

              <button className="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <nav className={`heroNavLinks ${isMenuOpen ? 'open' : ''}`}>
                <Link to="/newsroom/newsroom-alerts" className="heroNavLink" onClick={() => setIsMenuOpen(false)}>
                  <Rss size={14} />Announcements
                </Link>
                <Link to="/newsroom/news-releases" className="heroNavLink" onClick={() => setIsMenuOpen(false)}>
                  <Rss size={14} />Releases
                </Link>
                <Link to="/newsroom/policy-updates" className="heroNavLink" onClick={() => setIsMenuOpen(false)}>
                  <BookOpen size={14} />Policy Updates
                </Link>
                <Link to="/newsroom/visa-bulletin" className="heroNavLink" onClick={() => setIsMenuOpen(false)}>
                  <BarChart3 size={14} />Visa Bulletin
                </Link>
                <Link to="/processing-times" className="heroNavLink" onClick={() => setIsMenuOpen(false)}>
                  <Activity size={14} />Processing Times
                </Link>
              </nav>
            </div>
            <div className={`heroNavActions ${isMenuOpen ? 'open' : ''}`}>
              {isAuthenticated ? (
                <>
                  <Link to="/notifications" className="heroNavIcon" title="Notifications" onClick={() => setIsMenuOpen(false)}>
                    <Bell size={17} />
                    {unreadCount > 0 && <span className="unreadBadge">{unreadCount}</span>}
                  </Link>
                  <div className="heroUserMenuWrapper" ref={headerUserMenuRef}>
                    <button
                      className={`heroNavUser ${isHeaderUserMenuOpen ? 'active' : ''}`}
                      onClick={() => setIsHeaderUserMenuOpen(!isHeaderUserMenuOpen)}
                    >
                      <div className="heroAvatar">
                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="heroUserName">{user?.fullName || user?.username}</span>
                      <ChevronDown size={14} className={`heroChevron ${isHeaderUserMenuOpen ? 'rotate' : ''}`} />
                    </button>

                    {isHeaderUserMenuOpen && (
                      <div className="heroUserDropdown">
                        <div className="dropdownHeader">
                          <p className="userEmail">{user?.email}</p>
                        </div>
                        <div className="dropdownDivider"></div>
                        <Link to="/profile" className="dropdownItem" onClick={() => setIsHeaderUserMenuOpen(false)}>
                          <User size={16} />
                          Profile Settings
                        </Link>
                        <div className="dropdownDivider"></div>
                        <button onClick={handleLogoutClick} className="dropdownItem logout">
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/register" className="heroNavRegister" onClick={() => setIsMenuOpen(false)}>
                    <UserPlus size={17} />Register
                  </Link>
                  <Link to="/login" className="heroNavLogin" onClick={() => setIsMenuOpen(false)}>
                    <LogIn size={17} />Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="heroMainContent">
          <div className="heroTextContent">
            <h1>USCIS Intelligence Platform</h1>
            <div className="tagline">
              <span>Struggling to keep up with USCIS changes?</span>
              <strong>Never miss a new form or regulation again.</strong>
            </div>
            <p>Subscribe to forms, processing times, and policy updates for real-time monitoring and instant AI-driven alerts.</p>
          </div>

          <div className="heroVisualContent">
            <div className="logoContainer">
              <img src="/logo.jpg" alt="Komunas Logo" />
              <div className="shineEffect"></div>
            </div>
          </div>
        </div>

        {/* ── Intelligence Brief / Workspace ── */}
        {isAuthenticated && (
          <div className="userWorkspace">
            <div className="workspaceHeader">
              <h2>Intelligence Brief for {user?.fullName || user?.username}</h2>
              <p>Direct access to your monitored USCIS resources and high-fidelity alerts.</p>
            </div>

            <div className="workspaceGrid">
              <div className="surveillanceCard">
                <div className="pulseHeader">
                  <div className="userMenuWrapper" ref={userMenuRef}>
                    <button
                      className={`userBadge ${isUserMenuOpen ? 'active' : ''}`}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      title="User Menu"
                    >
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </button>

                    {isUserMenuOpen && (
                      <div className="userDropdown">
                        <div className="dropdownHeader">
                          <p className="userName">{user?.fullName || user?.username}</p>
                          <p className="userEmail">{user?.email}</p>
                        </div>
                        <div className="dropdownDivider"></div>
                        <Link to="/profile" className="dropdownItem" onClick={() => setIsUserMenuOpen(false)}>
                          <User size={16} />
                          Profile Settings
                        </Link>
                        <button onClick={handleLogoutClick} className="dropdownItem logout">
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="pulseTitle">
                    <h3>My Surveillance Dashboard</h3>
                    <p>Real-time updates and alerts for your tracked resources</p>
                  </div>
                </div>

                <div className="statsGrid">
                  <div className="statItem">
                    <div className="statIcon"><FileText size={20} /></div>
                    <div className="statInfo">
                      <span className="statValue">{forms.filter(f => f.subscribed).length}</span>
                      <span className="statLabel">Forms Monitored</span>
                    </div>
                  </div>
                  <div className="statItem">
                    <div className="statIcon"><Zap size={20} /></div>
                    <div className="statInfo">
                      <span className="statValue">{monitoredStats.latestDate}</span>
                      <span className="statLabel">Latest Alert</span>
                    </div>
                  </div>
                  <div className="statItem">
                    <div className="statIcon"><AlertTriangle size={20} /></div>
                    <div className="statInfo">
                      <span className="statValue">{forms.filter(f => f.subscribed && f.changeDetected).length}</span>
                      <span className="statLabel">Critical Changes</span>
                    </div>
                  </div>
                  <div className="statItem">
                    <div className="statIcon"><Shield size={20} /></div>
                    <div className="statInfo">
                      <span className="statValue">{monitoredStats.count}</span>
                      <span className="statLabel">Total Monitored</span>
                    </div>
                  </div>
                  <Link to="/notifications" className="statItem alerts">
                    <div className="statIcon">
                      <Bell size={20} />
                      {unreadCount > 0 && <span className="notificationBadge">{unreadCount}</span>}
                    </div>
                    <div className="statInfo">
                      <span className="statValue">{unreadCount}</span>
                      <span className="statLabel">Unread Alerts</span>
                    </div>
                  </Link>
                </div>

                <div className="syncHealthSection">
                  <div className="healthHeader">
                    <div className="pulse"></div>
                    <span>Intelligence Sync Health</span>
                  </div>
                  <div className="syncList">
                    <DataToolTip text={`Monitors USCIS PDF Edition Dates and form instructions for version shifts. \n\nLast Checked: ${syncStatus.forms ? formatDateTime(syncStatus.forms) : 'Never'}`}>
                      <div className="syncItem">
                        <div className="syncLabel"><FileText size={12} /> Forms</div>
                        <div className="syncValue">{syncStatus.forms ? getRelativeTime(syncStatus.forms) : 'N/A'}</div>
                      </div>
                    </DataToolTip>
                    <DataToolTip text={`Tracks the latest Newsroom Alerts and Releases for immediate policy impact. \n\nLast Checked: ${syncStatus.newsroom ? formatDateTime(syncStatus.newsroom) : 'Never'}`}>
                      <div className="syncItem">
                        <div className="syncLabel"><Rss size={12} /> Newsroom</div>
                        <div className="syncValue">{syncStatus.newsroom ? getRelativeTime(syncStatus.newsroom) : 'N/A'}</div>
                      </div>
                    </DataToolTip>
                    <DataToolTip text={`Monitors the USCIS Policy Manual for substantive legal and chapter updates. \n\nLast Checked: ${syncStatus.policy ? formatDateTime(syncStatus.policy) : 'Never'}`}>
                      <div className="syncItem">
                        <div className="syncLabel"><BookOpen size={12} /> Policy</div>
                        <div className="syncValue">{syncStatus.policy ? getRelativeTime(syncStatus.policy) : 'N/A'}</div>
                      </div>
                    </DataToolTip>
                    <DataToolTip text={`Checks for monthly Visa Bulletin priority date shifts and filing chart updates. \n\nLast Checked: ${syncStatus.bulletin ? formatDateTime(syncStatus.bulletin) : 'Never'}`}>
                      <div className="syncItem">
                        <div className="syncLabel"><BarChart3 size={12} /> Bulletin</div>
                        <div className="syncValue">{syncStatus.bulletin ? getRelativeTime(syncStatus.bulletin) : 'N/A'}</div>
                      </div>
                    </DataToolTip>
                    <DataToolTip text={`Real-time monitoring of USCIS wait time backlogs across different service centers. \n\nLast Checked: ${syncStatus.processing ? formatDateTime(syncStatus.processing) : 'Never'}`}>
                      <div className="syncItem">
                        <div className="syncLabel"><Activity size={12} /> Processing</div>
                        <div className="syncValue">{syncStatus.processing ? getRelativeTime(syncStatus.processing) : 'N/A'}</div>
                      </div>
                    </DataToolTip>
                  </div>
                </div>

                <div className="sectionDivider"></div>

                <div className="subsSection">
                  <div className="subsHeader">
                    <h4 className="subsTitle">My Monitored Resources</h4>
                    <span className="subsCountBadge">{monitoredStats.count} Active</span>
                  </div>
                  <div className="subsGrid">
                    {forms.filter(f => f.subscribed).length === 0 &&
                      processingTimes.filter(pt => pt.subscribed).length === 0 &&
                      !newsroomData?.subscribed &&
                      !newsReleasesData?.subscribed &&
                      !policyData?.subscribed &&
                      !visaBulletinData?.subscribed ? (
                      <div className="noSubs">No resources monitored yet. Browse the library below to start tracking.</div>
                    ) : (
                      <>
                        {forms.filter(f => f.subscribed).map(form => {
                          const isInitialDiscovery = form.changeDetected && (
                            form.payload?.status === "INITIAL_DISCOVERY" ||
                            form.payload?.categories?.some(c => c.status === "INITIAL_DISCOVERY") ||
                            form.changeType === "INITIAL_DISCOVERY" ||
                            form.summary?.includes("Baseline established")
                          );
                          return (
                            <Link key={form.id} to={`/form/${form.id}`} className={`subChip ${form.changeDetected ? (isInitialDiscovery ? 'baseline' : 'critical') : ''}`}>
                              <div className="chipIcon"><FileText size={16} /></div>
                              <div className="chipText">
                                <span className="chipId">{form.id}</span>
                                <span className="chipName">{form.displayName?.replace('USCIS ', '').replace('Form ', '')}</span>
                                <span className="chipStatus">
                                  {form.changeDetected
                                    ? (isInitialDiscovery ? 'Initial Discovery' : 'Change Detected')
                                    : 'Up to Date'}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                        {processingTimes.filter(pt => pt.subscribed).map(pt => (
                          <Link key={pt.resourceId} to={`/processing-times/${pt.resourceId}`} className={`subChip ${pt.changeDetected ? 'critical' : ''}`}>
                            <div className="chipIcon"><Activity size={16} /></div>
                            <div className="chipText">
                              <span className="chipId">{pt.resourceId} Wait Times</span>
                              <span className="chipStatus">{pt.changeDetected ? 'Change Detected' : 'Up to Date'}</span>
                            </div>
                          </Link>
                        ))}
                        {newsroomData?.subscribed && (
                          <Link to="/newsroom/newsroom-alerts" className="subChip">
                            <div className="chipIcon"><Rss size={16} /></div>
                            <div className="chipText">
                              <span className="chipId">USCIS Announcements</span>
                              <span className="chipStatus">Subscribed</span>
                            </div>
                          </Link>
                        )}
                        {newsReleasesData?.subscribed && (
                          <Link to="/newsroom/news-releases" className="subChip">
                            <div className="chipIcon"><Rss size={16} /></div>
                            <div className="chipText">
                              <span className="chipId">News Releases</span>
                              <span className="chipStatus">Subscribed</span>
                            </div>
                          </Link>
                        )}
                        {policyData?.subscribed && (
                          <Link to="/newsroom/policy-updates" className="subChip">
                            <div className="chipIcon"><BookOpen size={16} /></div>
                            <div className="chipText">
                              <span className="chipId">Policy Manual Updates</span>
                              <span className="chipStatus">Subscribed</span>
                            </div>
                          </Link>
                        )}
                        {visaBulletinData?.subscribed && (
                          <Link to="/newsroom/visa-bulletin" className="subChip">
                            <div className="chipIcon"><BarChart3 size={16} /></div>
                            <div className="chipText">
                              <span className="chipId">Visa Bulletin Charts</span>
                              <span className="chipStatus">Subscribed</span>
                            </div>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── Newsroom Snippet Strip: Announcements ── */}
        {newsroomAlerts.length > 0 && (
          <div className="newsroomStrip">
            <div className="stripInner">
              <div className="stripHeader">
                <div className="stripTitle">
                  <Rss size={22} />
                  <span>Latest USCIS Announcements</span>
                  {isAuthenticated ? (
                    newsroomData?.subscribed && (
                      <div className="statusBadge subscribed">
                        <CheckCircle size={14} />
                        <span>Subscribed</span>
                      </div>
                    )
                  ) : (
                    <Link to="/login" className="statusBadge guest">
                      <Bell size={14} />
                      <span>Login to get alerts</span>
                    </Link>
                  )}
                </div>
                <Link to="/newsroom/newsroom-alerts" className="stripViewAll">
                  View All Announcements<ExternalLink size={13} />
                </Link>
              </div>
              <div className="stripCards">
                {newsroomAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="stripCard"
                    onClick={() => setViewModal({ isOpen: true, item: alert, type: 'newsroom-alerts' })}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="stripDate">{alert.date}</span>
                    <h3 className="stripCardTitle">{alert.title}</h3>
                    <p className="stripCardSummary">{alert.summary}</p>
                    <span className="stripReadMore">Read announcement <ArrowRight size={11} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Newsroom Snippet Strip: News Releases ── */}
        {newsReleases.length > 0 && (
          <div className="newsroomStrip" style={{ marginTop: '2rem' }}>
            <div className="stripInner">
              <div className="stripHeader">
                <div className="stripTitle">
                  <Rss size={22} />
                  <span>Latest News Releases</span>
                  {isAuthenticated ? (
                    newsReleasesData?.subscribed && (
                      <div className="statusBadge subscribed">
                        <CheckCircle size={14} />
                        <span>Subscribed</span>
                      </div>
                    )
                  ) : (
                    <Link to="/login" className="statusBadge guest">
                      <Bell size={14} />
                      <span>Login to get alerts</span>
                    </Link>
                  )}
                </div>
                <Link to="/newsroom/news-releases" className="stripViewAll">
                  View All Releases<ExternalLink size={13} />
                </Link>
              </div>
              <div className="stripCards">
                {newsReleases.map((release, i) => (
                  <div
                    key={i}
                    className="stripCard"
                    onClick={() => setViewModal({ isOpen: true, item: release, type: 'news-releases' })}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="stripDate">{release.date}</span>
                    <h3 className="stripCardTitle">{release.title}</h3>
                    <p className="stripCardSummary">{release.summary}</p>
                    <span className="stripReadMore">Read announcement <ArrowRight size={11} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Visa Bulletin Determination Strip ── */}
        {visaBulletinData && (
          <div className="newsroomStrip" style={{ marginTop: '2rem' }}>
            <div className="stripInner">
              <div className="stripHeader">
                <div className="stripTitle">
                  <BarChart3 size={22} />
                  <span>Visa Bulletin Filing Charts</span>
                  <div className="monthBadge">{visaBulletinData.payload?.month} {visaBulletinData.payload?.year}</div>
                  {isAuthenticated ? (
                    visaBulletinData.subscribed && (
                      <div className="statusBadge subscribed">
                        <CheckCircle size={14} />
                        <span>Subscribed</span>
                      </div>
                    )
                  ) : (
                    <Link to="/login" className="statusBadge guest">
                      <Bell size={14} />
                      <span>Login to get alerts</span>
                    </Link>
                  )}
                </div>
                <Link to="/newsroom/visa-bulletin" className="stripViewAll">
                  View All Bulletins <ExternalLink size={13} />
                </Link>
              </div>
              <div className="stripCards determinationCards">
                <div
                  className="stripCard determinationCard clickable"
                  onClick={() => visaBulletinData.payload?.title && setViewModal({
                    isOpen: true,
                    item: {
                      ...visaBulletinData.payload,
                      url: visaBulletinData.payload.familyDetermination?.url,
                      date: `${visaBulletinData.payload.month} ${visaBulletinData.payload.year}`
                    },
                    type: 'visa-bulletin'
                  })}
                  style={{ cursor: visaBulletinData.payload?.title ? 'pointer' : 'default' }}
                >
                  <div className="cardHeader">
                    <span className="stripLabel">Family-Sponsored</span>
                    {visaBulletinData.payload?.highlights?.some(h =>
                      h.category.startsWith('F') ||
                      h.category.toLowerCase().includes('family')
                    ) && (
                        <span className="movementBadge">Movement</span>
                      )}
                  </div>
                  <h3 className="determinationValue">{visaBulletinData.payload?.familyDetermination?.chartType || 'Dates for Filing'}</h3>

                  {visaBulletinData.payload?.highlights && visaBulletinData.payload.highlights.filter(h => h.category.startsWith('F') || h.category.toLowerCase().includes('family')).length > 0 ? (
                    <div className="featuredDates">
                      {visaBulletinData.payload.highlights
                        .filter(h =>
                          h.category.startsWith('F') ||
                          h.category.toLowerCase().includes('family')
                        )
                        .slice(0, 3)
                        .map((h, i) => (
                          <div key={i} className="dateRow">
                            <span className="cat">{h.category}</span>
                            <span className="val">{h.movement.split(' ')[0]}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="featuredDates empty">
                      <div className="dateRow">
                        <span className="cat">Stability</span>
                        <span className="val">No significant movement</span>
                      </div>
                    </div>
                  )}

                  <p className="determinationSub">Use this chart for {visaBulletinData.payload?.month} filings.</p>
                  {visaBulletinData.payload?.familyDetermination?.url && (
                    <div
                      className="stripReadMore"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewModal({
                          isOpen: true,
                          item: {
                            ...visaBulletinData.payload,
                            url: visaBulletinData.payload.familyDetermination.url,
                            date: `${visaBulletinData.payload.month} ${visaBulletinData.payload.year}`
                          },
                          type: 'visa-bulletin'
                        });
                      }}
                    >
                      View Official Bulletin <ArrowRight size={11} />
                    </div>
                  )}
                </div>

                <div
                  className="stripCard determinationCard clickable"
                  onClick={() => visaBulletinData.payload?.title && setViewModal({
                    isOpen: true,
                    item: {
                      ...visaBulletinData.payload,
                      url: visaBulletinData.payload.employmentDetermination?.url,
                      date: `${visaBulletinData.payload.month} ${visaBulletinData.payload.year}`
                    },
                    type: 'visa-bulletin'
                  })}
                  style={{ cursor: visaBulletinData.payload?.title ? 'pointer' : 'default' }}
                >
                  <div className="cardHeader">
                    <span className="stripLabel">Employment-Based</span>
                    {visaBulletinData.payload?.highlights?.some(h =>
                      h.category.startsWith('EB') ||
                      /^\d/.test(h.category) ||
                      h.category.toLowerCase().includes('worker') ||
                      h.category.toLowerCase().includes('employment') ||
                      h.category.toLowerCase().includes('aside')
                    ) && (
                        <span className="movementBadge">Movement</span>
                      )}
                  </div>
                  <h3 className="determinationValue">{visaBulletinData.payload?.employmentDetermination?.chartType || 'Final Action Dates'}</h3>

                  {visaBulletinData.payload?.highlights && visaBulletinData.payload.highlights.filter(h => h.category.startsWith('EB') || /^\d/.test(h.category)).length > 0 ? (
                    <div className="featuredDates">
                      {visaBulletinData.payload.highlights
                        .filter(h =>
                          h.category.startsWith('EB') ||
                          /^\d/.test(h.category) ||
                          h.category.toLowerCase().includes('worker') ||
                          h.category.toLowerCase().includes('employment') ||
                          h.category.toLowerCase().includes('aside')
                        )
                        .slice(0, 3)
                        .map((h, i) => (
                          <div key={i} className="dateRow">
                            <span className="cat">{h.category}</span>
                            <span className="val">{h.movement.split(' ')[0]}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="featuredDates empty">
                      <div className="dateRow">
                        <span className="cat">Stability</span>
                        <span className="val">No significant movement</span>
                      </div>
                    </div>
                  )}

                  <p className="determinationSub">Use this chart for {visaBulletinData.payload?.month} filings.</p>
                  {visaBulletinData.payload?.employmentDetermination?.url && (
                    <div
                      className="stripReadMore"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewModal({
                          isOpen: true,
                          item: {
                            ...visaBulletinData.payload,
                            url: visaBulletinData.payload.employmentDetermination.url,
                            date: `${visaBulletinData.payload.month} ${visaBulletinData.payload.year}`
                          },
                          type: 'visa-bulletin'
                        });
                      }}
                    >
                      View Official Bulletin <ArrowRight size={11} />
                    </div>
                  )}
                </div>
                {visaBulletinData.payload?.title && (
                  <div
                    className="stripCard determinationCard intelligence"
                    onClick={() => setViewModal({
                      isOpen: true,
                      item: {
                        ...visaBulletinData.payload,
                        url: visaBulletinData.payload.familyDetermination?.url,
                        date: `${visaBulletinData.payload.month} ${visaBulletinData.payload.year}`
                      },
                      type: 'visa-bulletin'
                    })}
                  >
                    <span className="stripLabel">Intelligence Analysis</span>
                    <h3 className="determinationValue">{visaBulletinData.payload.title}</h3>
                    <p className="determinationSub">{visaBulletinData.payload.summary}</p>
                    <span className="stripReadMore">View Analysis Digest <ArrowRight size={11} /></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Processing Times Intelligence Strip ── */}
        {processingTimes.length > 0 && (
          <div className="newsroomStrip" style={{ marginTop: '2rem' }}>
            <div className="stripInner">
              <div className="stripHeader">
                <div className="stripTitle">
                  <Activity size={22} />
                  <span>Processing Times Intelligence</span>
                </div>
                <Link to="/processing-times" className="stripViewAll">
                  View All Forms <ExternalLink size={13} />
                </Link>
              </div>
              <div className="stripCards">
                {processingTimes.map((pt, i) => (
                  <Link
                    key={i}
                    to={`/processing-times/${pt.resourceId}`}
                    className="stripCard"
                  >
                    <div className="ptHeader">
                      <div className="ptIdGroup">
                        <span className="ptFormId">{pt.resourceId}</span>
                        {pt.subscribed && (
                          <div className="statusBadge subscribed">
                            <CheckCircle size={14} /> Subscribed
                          </div>
                        )}
                        {pt.changeDetected && (
                          <div className="statusBadge critical">
                            <AlertTriangle size={14} /> Update Detected
                          </div>
                        )}
                      </div>
                      <span className="stripDate">{formatDateTime(pt.lastCheckedAt)}</span>
                    </div>
                    <h3 className="stripCardTitle">
                      {pt.payload?.title || (pt.payload?.categoryLabel ? `${pt.resourceId.split('-')[0]}: ${pt.payload.categoryLabel}` : pt.summary)}
                    </h3>

                    <div className="stripCardMeta">
                      <span className="miniBadge">Wait: {pt.payload?.percentile80?.split(' depending')[0] || 'N/A'}</span>
                      <span className="miniBadge trendIndicator" data-trend={pt.payload?.trend?.toLowerCase()}>
                        {pt.payload?.trend || 'Stable'}
                      </span>
                      {pt.payload?.officeLabel && <span className="miniBadge">{pt.payload.officeLabel}</span>}
                    </div>

                    <p className="stripCardSummary">{pt.payload?.analysis?.substring(0, 100)}...</p>
                    <div className="stripReadMore">View Intelligence Digest <ArrowRight size={11} /></div>

                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Policy Manual Updates Strip ── */}
        {policyUpdates.length > 0 && (
          <div className="newsroomStrip" style={{ marginTop: '2rem' }}>
            <div className="stripInner">
              <div className="stripHeader">
                <div className="stripTitle">
                  <BookOpen size={22} />
                  <span>USCIS Policy Manual Updates</span>
                  {isAuthenticated ? (
                    policyData?.subscribed && (
                      <div className="statusBadge subscribed">
                        <CheckCircle size={14} />
                        <span>Subscribed</span>
                      </div>
                    )
                  ) : (
                    <Link to="/login" className="statusBadge guest">
                      <Bell size={14} />
                      <span>Login to get alerts</span>
                    </Link>
                  )}
                </div>
                <Link to="/newsroom/policy-updates" className="stripViewAll">
                  View All <ExternalLink size={13} />
                </Link>
              </div>
              <div className="stripCards">
                {policyUpdates.map((update, i) => (
                  <div
                    key={i}
                    className="stripCard"
                    onClick={() => setViewModal({ isOpen: true, item: update, type: 'policy-updates' })}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="stripDate">{update.date}</span>
                    <h3 className="stripCardTitle">{update.title}</h3>
                    <p className="stripCardSummary" style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      margin: '0.4rem 0 0.6rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{update.summary}</p>
                    <div className="stripCardMeta">
                      {update.chapters && update.chapters.slice(0, 2).map((ch, idx) => (
                        <span key={idx} className="miniBadge">{ch.title.split(' - ')[0]}</span>
                      ))}
                    </div>
                    <span className="stripReadMore">Review substantive changes <ArrowRight size={11} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Forms Grid ── */}
      <main className="formsGrid">
        <div className="sectionHeader">
          <h2>USCIS Forms Library</h2>
          <div className="sectionHeaderActions">
            <div className="searchWrapper">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="countBadge">{filteredForms.length} Forms Available</div>
          </div>
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
                      {form.subscribed && (
                        <div className="statusBadge subscribed mini">
                          <CheckCircle size={10} /> Subscribed
                        </div>
                      )}
                      {form.changeDetected && (
                        (form.payload?.status === "INITIAL_DISCOVERY" ||
                          form.payload?.categories?.some(c => c.status === "INITIAL_DISCOVERY") ||
                          form.changeType === "INITIAL_DISCOVERY" ||
                          form.summary?.includes("Baseline established")) ? (
                          <span className="baselineBadge">
                            <Info size={12} />
                            INITIAL DISCOVERY
                          </span>
                        ) : (
                          <span className="criticalBadge">
                            <AlertTriangle size={12} />
                            CRITICAL CHANGE
                          </span>
                        )
                      )}
                    </div>
                    <span className="formVersion">v{form.version}</span>
                  </div>
                  <h3 className="formName">
                    <Link to={`/form/${form.id}`}>{form.displayName}</Link>
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

      <SubscribeFormModal
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
      <ViewIntelModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal(prev => ({ ...prev, isOpen: false }))}
        item={viewModal.item}
        type={viewModal.type}
        onViewAll={() => navigate(`/newsroom/${viewModal.type}`)}
      />
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutModalOpen(false);
          setIsMenuOpen(false);
        }}
      />
    </div>
  );
};

export default Home;
