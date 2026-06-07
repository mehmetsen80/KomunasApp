import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Shield, 
  Search, 
  Bell, 
  FileText, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import subscriptionService from '../../services/subscriptionService';
import { formatDateTime } from '../../utils/dateUtils';
import SubscribeFormModal from '../../components/Modals/SubscribeFormModal';
import SubscribeNewsroomModal from '../../components/Modals/SubscribeNewsroomModal';
import SubscribePolicyModal from '../../components/Modals/SubscribePolicyModal';
import SubscribeProcessingTimesModal from '../../components/Modals/SubscribeProcessingTimesModal';
import './styles.scss';

const Sources = () => {
  const { user } = useAuth();
  const userEmail = user?.email || user?.username;
  const userId = userEmail;

  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterSubscribed, setFilterSubscribed] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, item: null, isUnsubscribing: false });

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const [formsData, alertsData, releasesData, policyData, visaData, procData] = await Promise.allSettled([
        resourceSyncService.getAllFormStatuses(userId),
        resourceSyncService.getNewsroomStatus('newsroom-alerts', userId),
        resourceSyncService.getNewsroomStatus('news-releases', userId),
        resourceSyncService.getPolicyManualStatus('policy-updates', userId),
        resourceSyncService.getVisaBulletinStatus('filing-charts', userId),
        resourceSyncService.getAllProcessingTimesStatuses(userId),
      ]);

      const flatSources = [
        // Forms
        ...(formsData.status === 'fulfilled' ? formsData.value.map(item => ({
          id: item.id,
          title: `Form ${item.id}`,
          subtitle: item.displayName?.replace(/^USCIS Form /i, '').trim() || 'USCIS Form',
          category: 'forms',
          categoryLabel: 'USCIS Form',
          status: item.status,
          version: item.version,
          lastCheckedAt: item.lastCheckedAt,
          subscribed: item.subscribed,
          subscriptionId: item.subscriptionId,
          domain: item.domain,
          categoryKey: item.category,
          path: `/form/${item.id}`
        })) : []),

        // Newsroom & Announcements
        ...(alertsData.status === 'fulfilled' && alertsData.value ? [{
          id: 'newsroom-alerts',
          title: 'Announcements',
          subtitle: 'USCIS Announcements & Alerts',
          category: 'newsroom',
          categoryLabel: 'Newsroom Alerts',
          status: alertsData.value.enabled ? 'Active' : 'Inactive',
          version: alertsData.value.currentVersion || 'N/A',
          lastCheckedAt: alertsData.value.lastCheckedAt,
          subscribed: alertsData.value.subscribed,
          subscriptionId: alertsData.value.subscriptionId,
          domain: alertsData.value.domain,
          categoryKey: alertsData.value.category,
          path: '/newsroom/newsroom-alerts'
        }] : []),

        ...(releasesData.status === 'fulfilled' && releasesData.value ? [{
          id: 'news-releases',
          title: 'News Releases',
          subtitle: 'USCIS Press & Media Releases',
          category: 'newsroom',
          categoryLabel: 'News Releases',
          status: releasesData.value.enabled ? 'Active' : 'Inactive',
          version: releasesData.value.currentVersion || 'N/A',
          lastCheckedAt: releasesData.value.lastCheckedAt,
          subscribed: releasesData.value.subscribed,
          subscriptionId: releasesData.value.subscriptionId,
          domain: releasesData.value.domain,
          categoryKey: releasesData.value.category,
          path: '/newsroom/news-releases'
        }] : []),

        ...(policyData.status === 'fulfilled' && policyData.value ? [{
          id: 'policy-updates',
          title: 'Policy Manual',
          subtitle: 'USCIS Substantive Guidance Updates',
          category: 'newsroom',
          categoryLabel: 'Policy Updates',
          status: policyData.value.enabled ? 'Active' : 'Inactive',
          version: policyData.value.currentVersion || 'N/A',
          lastCheckedAt: policyData.value.lastCheckedAt,
          subscribed: policyData.value.subscribed,
          subscriptionId: policyData.value.subscriptionId,
          domain: policyData.value.domain,
          categoryKey: policyData.value.category,
          path: '/newsroom/policy-updates'
        }] : []),

        // Visa Bulletins
        ...(visaData.status === 'fulfilled' && visaData.value ? [{
          id: 'visa-bulletin',
          title: 'Visa Bulletin',
          subtitle: 'Adjustment of Status Filing Charts',
          category: 'bulletins',
          categoryLabel: 'Filing Determinations',
          status: visaData.value.enabled ? 'Active' : 'Inactive',
          version: visaData.value.currentVersion || 'N/A',
          lastCheckedAt: visaData.value.lastCheckedAt,
          subscribed: visaData.value.subscribed,
          subscriptionId: visaData.value.subscriptionId,
          domain: visaData.value.domain,
          categoryKey: visaData.value.category,
          path: '/newsroom/visa-bulletin'
        }] : []),

        // Processing Times
        ...(procData.status === 'fulfilled' ? procData.value.map(item => ({
          id: item.resourceId,
          title: `Processing Times ${item.resourceId}`,
          subtitle: item.displayName || 'USCIS Backlog Wait Times',
          category: 'bulletins',
          categoryLabel: 'USCIS Wait Times',
          status: item.enabled ? 'Active' : 'Inactive',
          version: item.currentVersion || 'N/A',
          lastCheckedAt: item.lastCheckedAt,
          subscribed: item.subscribed,
          subscriptionId: item.subscriptionId,
          domain: item.domain,
          categoryKey: item.category,
          path: `/processing-times/${item.resourceId}`
        })) : [])
      ];

      setSources(flatSources);
    } catch (err) {
      console.error('Failed to load all system resources:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleOpenModal = (item) => {
    setModalConfig({
      isOpen: true,
      item: item,
      isUnsubscribing: item.subscribed
    });
  };

  const handleModalSuccess = () => {
    const targetItem = modalConfig.item;
    if (!targetItem) return;

    const isUnsub = modalConfig.isUnsubscribing;

    // Optimistic update
    setSources(prev => prev.map(s => 
      (s.id === targetItem.id && s.category === targetItem.category)
        ? { ...s, subscribed: !isUnsub, subscriptionId: isUnsub ? null : s.subscriptionId } 
        : s
    ));

    // Sync with backend in the background after a brief delay
    setTimeout(fetchSources, 1500);
  };

  // Filtered lists
  const filteredSources = sources.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || s.category === activeTab;
    const matchesSubscribed = !filterSubscribed || s.subscribed;
    return matchesSearch && matchesTab && matchesSubscribed;
  });

  const totalSources = sources.length;
  const activeSources = sources.filter(s => s.status === 'Active').length;
  const activeCoverage = totalSources > 0 ? Math.round((activeSources / totalSources) * 100) : 100;
  const subscribedSources = sources.filter(s => s.subscribed).length;

  return (
    <div className="sourcesPage">
      {/* Header */}
      <div className="pageHeader">
        <div className="headerContent">
          <div className="titleArea">
            <div className="badge">
              <Layers size={14} />
              <span>Regulatory Feeds</span>
            </div>
            <h1 className="sourcesTitle">USCIS Monitored Sources</h1>
            <p className="subtitle">
              Explore, monitor, and subscribe to real-time regulatory streams in the system.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="sourcesStats">
        <div className="statCard">
          <div className="statIcon"><Layers size={22} /></div>
          <div className="statContent">
            <span className="statLabel">Total Sources</span>
            <span className="statValue">{totalSources}</span>
          </div>
        </div>
        <div className="statCard">
          <div className="statIcon"><Shield size={22} /></div>
          <div className="statContent">
            <span className="statLabel">Coverage Health</span>
            <span className="statValue">{activeCoverage}%</span>
          </div>
        </div>
        <div className="statCard">
          <div className="statIcon"><Bell size={22} /></div>
          <div className="statContent">
            <span className="statLabel">Subscribed Feeds</span>
            <span className="statValue">{subscribedSources}</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="sourcesFilterBar">
        {/* Search */}
        <div className="searchBox">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            className="searchInput"
            placeholder="Search resources by title, code or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="filterControls">
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tabBtn ${activeTab === 'all' ? 'tabBtn--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`tabBtn ${activeTab === 'forms' ? 'tabBtn--active' : ''}`}
              onClick={() => setActiveTab('forms')}
            >
              Forms
            </button>
            <button 
              className={`tabBtn ${activeTab === 'newsroom' ? 'tabBtn--active' : ''}`}
              onClick={() => setActiveTab('newsroom')}
            >
              Announcements & Legal
            </button>
            <button 
              className={`tabBtn ${activeTab === 'bulletins' ? 'tabBtn--active' : ''}`}
              onClick={() => setActiveTab('bulletins')}
            >
              Wait Times
            </button>
          </div>

          {/* Subscribed checkbox */}
          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={filterSubscribed}
              onChange={(e) => setFilterSubscribed(e.target.checked)}
            />
            Show Subscribed Only
          </label>
        </div>
      </div>

      {/* Main Content list */}
      {loading ? (
        <div className="sourcesLoading">
          <div className="loadingSpinner" />
          <span>Synchronizing all regulatory source nodes...</span>
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="sourcesEmpty">
          <AlertCircle size={48} />
          <h3>No regulatory sources found</h3>
          <p>Try refining your search terms or adjusting the active filters.</p>
        </div>
      ) : (
        <div className="sourcesGrid">
          {filteredSources.map((item) => (
            <div key={`${item.category}-${item.id}`} className={`sourceCard sourceCard--${item.category}`}>
              <div className="cardTop">
                <div className="cardInfo">
                  <span className="sourceBadge">{item.categoryLabel}</span>
                  <h3 className="sourceTitle">{item.title}</h3>
                  <span className="sourceSubtitle">{item.subtitle}</span>
                </div>
                <span className={`statusBadge ${item.status === 'Active' ? 'active' : 'inactive'}`}>
                  {item.status}
                </span>
              </div>

              <div className="cardDetails">
                <div className="detailItem">
                  <span>Current Version</span>
                  <strong>{item.version || 'N/A'}</strong>
                </div>
                <div className="detailItem">
                  <span>Last Checked</span>
                  <strong>{item.lastCheckedAt ? formatDateTime(item.lastCheckedAt).split(',')[0] : 'Never'}</strong>
                </div>
              </div>

              <div className="cardActions">
                <Link to={item.path} className="btn btnIntel">
                  Explore Feed <ArrowRight size={14} />
                </Link>

                <button
                  className={`btn btnSubscribe ${item.subscribed ? 'subscribed' : 'unsubscribed'}`}
                  onClick={() => handleOpenModal(item)}
                  onMouseEnter={() => setHoveredKey(`${item.category}-${item.id}`)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  {item.subscribed ? (
                    hoveredKey === `${item.category}-${item.id}` ? (
                      <>
                        <AlertCircle size={14} /> Unsubscribe
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} /> Subscribed
                      </>
                    )
                  ) : (
                    <>
                      <Bell size={14} /> Subscribe
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscription Modals */}
      {modalConfig.isOpen && modalConfig.item && (
        <>
          {modalConfig.item.category === 'forms' && (
            <SubscribeFormModal
              isOpen={modalConfig.isOpen}
              onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              onSuccess={handleModalSuccess}
              formId={modalConfig.item.id}
              domain={modalConfig.item.domain}
              category={modalConfig.item.categoryKey}
              userEmail={userEmail}
              subscriptionId={modalConfig.item.subscriptionId}
              isUnsubscribing={modalConfig.isUnsubscribing}
            />
          )}

          {modalConfig.item.category === 'newsroom' && modalConfig.item.id === 'policy-updates' && (
            <SubscribePolicyModal
              isOpen={modalConfig.isOpen}
              onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              onSuccess={handleModalSuccess}
              resourceId={modalConfig.item.id}
              domain={modalConfig.item.domain}
              category={modalConfig.item.categoryKey}
              userEmail={userEmail}
              subscriptionId={modalConfig.item.subscriptionId}
              isUnsubscribing={modalConfig.isUnsubscribing}
            />
          )}

          {modalConfig.item.category === 'newsroom' && modalConfig.item.id !== 'policy-updates' && (
            <SubscribeNewsroomModal
              isOpen={modalConfig.isOpen}
              onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              onSuccess={handleModalSuccess}
              resourceId={modalConfig.item.id}
              domain={modalConfig.item.domain}
              category={modalConfig.item.categoryKey}
              userEmail={userEmail}
              subscriptionId={modalConfig.item.subscriptionId}
              isUnsubscribing={modalConfig.isUnsubscribing}
            />
          )}

          {modalConfig.item.category === 'bulletins' && modalConfig.item.id === 'visa-bulletin' && (
            <SubscribeNewsroomModal
              isOpen={modalConfig.isOpen}
              onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              onSuccess={handleModalSuccess}
              resourceId="filing-charts"
              domain={modalConfig.item.domain}
              category={modalConfig.item.categoryKey}
              userEmail={userEmail}
              subscriptionId={modalConfig.item.subscriptionId}
              isUnsubscribing={modalConfig.isUnsubscribing}
            />
          )}

          {modalConfig.item.category === 'bulletins' && modalConfig.item.id !== 'visa-bulletin' && (
            <SubscribeProcessingTimesModal
              isOpen={modalConfig.isOpen}
              onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              onSuccess={handleModalSuccess}
              resourceId={modalConfig.item.id}
              domain={modalConfig.item.domain}
              category={modalConfig.item.categoryKey}
              userEmail={userEmail}
              subscriptionId={modalConfig.item.subscriptionId}
              isUnsubscribing={modalConfig.isUnsubscribing}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Sources;
