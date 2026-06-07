import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Search,
  Bell,
  FileText,
  CheckCircle2,
  Filter,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  BookOpen,
  Newspaper,
  Activity,
  ShieldCheck,
  Info,
  ShieldAlert
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import './styles.scss';

const ChangeMonitor = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyMonitored, setShowOnlyMonitored] = useState(false);

  const loadChanges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all statuses in parallel
      const [
        formsList,
        newsroomAlerts,
        newsReleases,
        policyUpdates,
        visaBulletin,
        procList
      ] = await Promise.all([
        resourceSyncService.getAllFormStatuses(user?.email).catch(err => {
          console.error('Error fetching forms:', err);
          return [];
        }),
        resourceSyncService.getNewsroomStatus('newsroom-alerts', user?.email).catch(err => {
          console.error('Error fetching newsroom-alerts:', err);
          return null;
        }),
        resourceSyncService.getNewsroomStatus('news-releases', user?.email).catch(err => {
          console.error('Error fetching news-releases:', err);
          return null;
        }),
        resourceSyncService.getPolicyManualStatus('policy-updates', user?.email).catch(err => {
          console.error('Error fetching policy-updates:', err);
          return null;
        }),
        resourceSyncService.getVisaBulletinStatus('filing-charts', user?.email).catch(err => {
          console.error('Error fetching visa-bulletin:', err);
          return null;
        }),
        resourceSyncService.getAllProcessingTimesStatuses(user?.email).catch(err => {
          console.error('Error fetching processing times:', err);
          return [];
        })
      ]);

      const allEvents = [];

      // 1. Process Form histories
      formsList.forEach(form => {
        const history = form.versionHistory || [];
        history.forEach(entry => {
          allEvents.push({
            id: `form-${form.id}-${entry.detectedAt || entry.version}`,
            resourceId: form.id,
            resourceName: form.displayName || `Form ${form.id}`,
            category: 'forms',
            detectedAt: entry.detectedAt,
            version: entry.version || 'v1.0',
            summary: entry.summary,
            changeDetected: entry.changeDetected,
            changeType: entry.changeDetected 
              ? (entry.summary?.includes('Baseline') || entry.changeType === 'INITIAL_DISCOVERY' ? 'INITIAL_DISCOVERY' : 'CRITICAL_CHANGE') 
              : 'ROUTINE_CHECK',
            resourceUrl: entry.resourceUrl || form.pdfUrl,
            instructionsUrl: entry.instructionsUrl || form.instrUrl,
            subscribed: form.subscribed,
            detailUrl: `/form/${form.id}`
          });
        });
      });

      // Helper to process single feed status history
      const processFeedHistory = (feedData, category, resourceId, resourceName, detailUrl) => {
        if (!feedData) return;
        const history = feedData.versionHistory || [];
        history.forEach(entry => {
          // Determine URL from alerts/updates if nested
          let eventUrl = entry.resourceUrl || feedData.resourceUrl;
          if (!eventUrl && entry.payload?.alerts?.length > 0) {
            eventUrl = entry.payload.alerts[0].url;
          } else if (!eventUrl && entry.payload?.updates?.length > 0) {
            eventUrl = entry.payload.updates[0].url;
          }

          allEvents.push({
            id: `${category}-${resourceId}-${entry.detectedAt || entry.version}`,
            resourceId,
            resourceName,
            category,
            detectedAt: entry.detectedAt,
            version: entry.version || 'N/A',
            summary: entry.summary,
            changeDetected: entry.changeDetected,
            changeType: entry.changeDetected 
              ? (entry.summary?.includes('Baseline') || entry.changeType === 'INITIAL_DISCOVERY' ? 'INITIAL_DISCOVERY' : 'CRITICAL_CHANGE') 
              : 'ROUTINE_CHECK',
            resourceUrl: eventUrl,
            subscribed: feedData.subscribed,
            detailUrl
          });
        });
      };

      // 2. Process Newsroom Alerts
      processFeedHistory(newsroomAlerts, 'newsroom', 'newsroom-alerts', 'USCIS Newsroom Alerts', '/newsroom/newsroom-alerts');
      
      // 3. Process News Releases
      processFeedHistory(newsReleases, 'newsroom', 'news-releases', 'USCIS News Releases', '/newsroom/news-releases');

      // 4. Process Policy Updates
      processFeedHistory(policyUpdates, 'policy-manual', 'policy-updates', 'USCIS Policy Manual Updates', '/newsroom/policy-updates');

      // 5. Process Visa Bulletin
      processFeedHistory(visaBulletin, 'visa-bulletin', 'filing-charts', 'Visa Bulletin Charts', '/newsroom/visa-bulletin');

      // 6. Process Processing Times
      procList.forEach(proc => {
        const history = proc.versionHistory || [];
        history.forEach(entry => {
          allEvents.push({
            id: `processing-times-${proc.resourceId}-${entry.detectedAt || entry.version}`,
            resourceId: proc.resourceId,
            resourceName: `Form ${proc.resourceId} Backlog Analysis`,
            category: 'processing-times',
            detectedAt: entry.detectedAt,
            version: entry.version || 'N/A',
            summary: entry.summary,
            changeDetected: entry.changeDetected,
            changeType: entry.changeDetected ? 'CRITICAL_CHANGE' : 'ROUTINE_CHECK',
            resourceUrl: null,
            subscribed: proc.subscribed,
            detailUrl: `/processing-times/${proc.resourceId}`
          });
        });
      });

      // Sort events by date descending
      allEvents.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

      setEvents(allEvents);
    } catch (err) {
      console.error('Error constructing change feed:', err);
      setError('Unable to load change monitor pipeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [user?.email]);

  // Compute stat metric numbers
  const totalEventsCount = events.length;
  const criticalAlertsCount = events.filter(e => e.changeType === 'CRITICAL_CHANGE').length;
  const monitoredSubscriptionsCount = new Set(events.filter(e => e.subscribed).map(e => e.resourceId)).size;

  // Filter events based on criteria
  const filteredEvents = events.filter(event => {
    // 1. Search Query Filter
    const matchesSearch = 
      event.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.summary && event.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Category Filter
    const matchesCategory = 
      selectedCategory === 'all' || 
      event.category === selectedCategory;

    // 3. Monitored Only Filter
    const matchesMonitored = !showOnlyMonitored || event.subscribed;

    return matchesSearch && matchesCategory && matchesMonitored;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'forms':
        return <FileText size={18} />;
      case 'newsroom':
        return <Newspaper size={18} />;
      case 'policy-manual':
        return <BookOpen size={18} />;
      case 'visa-bulletin':
        return <Calendar size={18} />;
      case 'processing-times':
        return <Activity size={18} />;
      default:
        return <TrendingUp size={18} />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'forms': return 'USCIS Form';
      case 'newsroom': return 'Newsroom Announcement';
      case 'policy-manual': return 'Policy Manual Update';
      case 'visa-bulletin': return 'Visa Bulletin';
      case 'processing-times': return 'Processing Time';
      default: return 'Regulatory Feed';
    }
  };

  const getChangeBadge = (changeType) => {
    switch (changeType) {
      case 'CRITICAL_CHANGE':
        return (
          <span className="badgeBadge critical">
            <ShieldAlert size={12} />
            CRITICAL CHANGE
          </span>
        );
      case 'INITIAL_DISCOVERY':
        return (
          <span className="badgeBadge initial">
            <Info size={12} />
            INITIAL DISCOVERY
          </span>
        );
      default:
        return (
          <span className="badgeBadge routine">
            <Clock size={12} />
            ROUTINE SYNC
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="changeMonitorLoading">
        <div className="loadingSpinner"></div>
        <span>Analyzing regulatory pipeline updates...</span>
      </div>
    );
  }

  return (
    <div className="changeMonitorPage">
      {/* Header */}
      <div className="pageHeader">
        <div className="headerContent">
          <div className="titleArea">
            <div className="badge">
              <TrendingUp size={14} />
              <span>Regulatory Timeline</span>
            </div>
            <h1 className="changeMonitorTitle">Change Monitor Feed</h1>
            <p className="subtitle">
              Real-time tracking of form revisions, legal policy shifts, newsroom alerts, and backlog changes in the immigration landscape.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="changeMonitorStats">
        <div className="statCard">
          <div className="statIcon">
            <Clock size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Synced Events</span>
            <span className="statValue">{totalEventsCount}</span>
          </div>
        </div>
        
        <div className="statCard">
          <div className="statIcon">
            <AlertTriangle size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Critical Updates</span>
            <span className="statValue">{criticalAlertsCount}</span>
          </div>
        </div>

        <div className="statCard">
          <div className="statIcon">
            <Bell size={22} />
          </div>
          <div className="statContent">
            <span className="statLabel">Active Monitors</span>
            <span className="statValue">{monitoredSubscriptionsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="changeMonitorFilterBar">
        {/* Search */}
        <div className="searchBox">
          <Search size={18} className="searchIcon" />
          <input
            type="text"
            className="searchInput"
            placeholder="Search events, forms, summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="filterControls">
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tabBtn ${selectedCategory === 'all' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Feeds
            </button>
            <button 
              className={`tabBtn ${selectedCategory === 'forms' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('forms')}
            >
              Forms
            </button>
            <button 
              className={`tabBtn ${selectedCategory === 'newsroom' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('newsroom')}
            >
              News
            </button>
            <button 
              className={`tabBtn ${selectedCategory === 'policy-manual' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('policy-manual')}
            >
              Policy Manual
            </button>
            <button 
              className={`tabBtn ${selectedCategory === 'visa-bulletin' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('visa-bulletin')}
            >
              Visa Bulletin
            </button>
            <button 
              className={`tabBtn ${selectedCategory === 'processing-times' ? 'tabBtn--active' : ''}`}
              onClick={() => setSelectedCategory('processing-times')}
            >
              Backlogs
            </button>
          </div>

          {/* Monitored check */}
          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={showOnlyMonitored}
              onChange={(e) => setShowOnlyMonitored(e.target.checked)}
            />
            Show Monitored Only
          </label>
        </div>
      </div>

      {/* Timeline Feed */}
      {filteredEvents.length > 0 ? (
        <div className="timelineContainer">
          <div className="timelineLine"></div>
          
          <div className="timelineList">
            {filteredEvents.map((event) => (
              <div key={event.id} className={`timelineItem ${event.changeType === 'CRITICAL_CHANGE' ? 'critical' : ''}`}>
                
                {/* Visual Icon Node on Timeline Line */}
                <div className="timelineNode">
                  {getCategoryIcon(event.category)}
                </div>

                {/* Timeline Event Card Content */}
                <div className="eventCard">
                  <div className="cardHeader">
                    <div className="resourceMeta">
                      <span className="categoryLabel">{getCategoryLabel(event.category)}</span>
                      <h3 className="resourceName">{event.resourceName}</h3>
                    </div>
                    <div className="badgesWrapper">
                      {event.subscribed && (
                        <span className="subscribedLabel">
                          <ShieldCheck size={11} /> Monitored
                        </span>
                      )}
                      {getChangeBadge(event.changeType)}
                    </div>
                  </div>

                  <div className="cardBody">
                    <p className="eventSummary">{event.summary}</p>
                    
                    <div className="eventDetails">
                      <div className="detailItem">
                        <Clock size={13} />
                        <span>Detected: <strong>{formatDateTime(event.detectedAt)}</strong></span>
                      </div>
                      {event.version && event.version !== 'N/A' && (
                        <div className="detailItem">
                          <Info size={13} />
                          <span>Version: <strong>{event.version}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cardActions">
                    <Link to={event.detailUrl} className="primaryActionLink">
                      Analyze Source <ChevronRight size={14} />
                    </Link>
                    
                    {event.resourceUrl && (
                      <a 
                        href={event.resourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="secondaryActionLink"
                      >
                        <ExternalLink size={13} /> View Official Site
                      </a>
                    )}

                    {event.category === 'forms' && event.resourceUrl && (
                      <a 
                        href={event.resourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="secondaryActionLink"
                      >
                        <Download size={13} /> Download Form (PDF)
                      </a>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="noResultsCard">
          <Search size={48} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
          <h3>No pipeline updates match your search</h3>
          <p>Try clearing some search terms or adjusting the category filters to locate specific events.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowOnlyMonitored(false);
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

export default ChangeMonitor;
