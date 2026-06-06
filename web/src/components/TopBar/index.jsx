import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, FileText, Clock, Newspaper } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './styles.scss';

const TopBar = ({ unreadCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sources, setSources] = useState({ forms: [], processingTimes: [] });
  const [loadingSources, setLoadingSources] = useState(false);
  
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.username || user?.email || 'U').slice(0, 2).toUpperCase();

  const displayName = user?.fullName || user?.username || 'User';
  const role = user?.roles?.includes('ADMIN') ? 'Admin' : 'Member';

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lazy load search sources on focus
  const handleFocus = async () => {
    setIsFocused(true);
    if (sources.forms.length > 0 || loadingSources) return;

    try {
      setLoadingSources(true);
      const userId = user?.email || user?.username;
      const [formsList, procList] = await Promise.all([
        resourceSyncService.getAllFormStatuses(userId).catch(() => []),
        resourceSyncService.getAllProcessingTimesStatuses(userId).catch(() => []),
      ]);

      setSources({
        forms: formsList,
        processingTimes: procList
      });
    } catch (err) {
      console.error('Failed to load search sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  // Filter items based on query
  const getFilteredResults = () => {
    if (!searchVal.trim()) return null;
    const query = searchVal.toLowerCase();

    const matchedForms = sources.forms
      .filter(f => f.id.toLowerCase().includes(query) || f.displayName?.toLowerCase().includes(query) || f.name?.toLowerCase().includes(query))
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        title: f.displayName || f.id,
        detail: f.name,
        path: `/form/${f.id}`,
        icon: <FileText size={14} />
      }));

    const matchedProc = sources.processingTimes
      .filter(p => p.displayName?.toLowerCase().includes(query) || p.resourceId?.toLowerCase().includes(query) || p.officeName?.toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({
        id: p.resourceId || p.id,
        title: p.displayName || 'Processing Times',
        detail: `${p.officeName || ''} - ${p.formType || ''}`,
        path: `/processing-times`,
        icon: <Clock size={14} />
      }));

    // Static Feeds match
    const staticFeeds = [
      { title: 'Newsroom Alerts', detail: 'USCIS Alerts & announcements feed', path: '/newsroom/newsroom-alerts', icon: <Newspaper size={14} /> },
      { title: 'News Releases', detail: 'USCIS News & official releases feed', path: '/newsroom/news-releases', icon: <Newspaper size={14} /> },
      { title: 'Policy Updates', detail: 'USCIS Policy Manual updates', path: '/newsroom/policy-updates', icon: <FileText size={14} /> },
      { title: 'Visa Bulletin', detail: 'Filing charts & visa bulletin', path: '/newsroom/visa-bulletin', icon: <Clock size={14} /> }
    ];

    const matchedFeeds = staticFeeds.filter(f => f.title.toLowerCase().includes(query) || f.detail.toLowerCase().includes(query));

    const totalResults = matchedForms.length + matchedProc.length + matchedFeeds.length;

    return {
      forms: matchedForms,
      processingTimes: matchedProc,
      feeds: matchedFeeds,
      total: totalResults
    };
  };

  const results = getFilteredResults();

  const handleItemClick = (path) => {
    setSearchVal('');
    setIsFocused(false);
    navigate(path);
  };

  const handleSaveSearch = async () => {
    if (!searchVal.trim()) return;
    try {
      const userId = user?.email || user?.username;
      await axiosInstance.post(`/api/saved-searches?userId=${userId}`, { query: searchVal.trim() });
      toast.success(`Search query "${searchVal}" saved successfully!`);
      setSearchVal('');
      setIsFocused(false);
    } catch (err) {
      console.error('Failed to save search:', err);
      toast.error('Failed to save search. Please try again later.');
    }
  };

  return (
    <header className="topBar">
      <div className="topBarInner">
        {/* Global Search */}
        <div className="topBarSearch" ref={searchContainerRef}>
          <Search size={15} className="searchIcon" />
          <input
            ref={inputRef}
            type="text"
            className="searchInput"
            placeholder="Search forms, announcements, sources..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={handleFocus}
          />
          <kbd className="searchKbd">⌘ K</kbd>

          {/* Floating Dropdown Popover */}
          {isFocused && searchVal.trim() && results && (
            <div className="searchDropdown">
              {results.total > 0 ? (
                <>
                  {results.forms.length > 0 && (
                    <div className="searchSection">
                      <div className="sectionTitle">Forms</div>
                      {results.forms.map(item => (
                        <div key={item.id} className="searchItem" onClick={() => handleItemClick(item.path)}>
                          <span className="itemIcon">{item.icon}</span>
                          <div className="itemContent">
                            <span className="itemTitle">{item.title}</span>
                            <span className="itemDetail">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.feeds.length > 0 && (
                    <div className="searchSection">
                      <div className="sectionTitle">News &amp; Policy Feeds</div>
                      {results.feeds.map(item => (
                        <div key={item.path} className="searchItem" onClick={() => handleItemClick(item.path)}>
                          <span className="itemIcon">{item.icon}</span>
                          <div className="itemContent">
                            <span className="itemTitle">{item.title}</span>
                            <span className="itemDetail">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.processingTimes.length > 0 && (
                    <div className="searchSection">
                      <div className="sectionTitle">Processing Times</div>
                      {results.processingTimes.map(item => (
                        <div key={item.id} className="searchItem" onClick={() => handleItemClick(item.path)}>
                          <span className="itemIcon">{item.icon}</span>
                          <div className="itemContent">
                            <span className="itemTitle">{item.title}</span>
                            <span className="itemDetail">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="noResults">No records match "{searchVal}"</div>
              )}
              <div className="searchSection" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginTop: '4px', paddingTop: '4px' }}>
                <div className="searchItem" onClick={handleSaveSearch}>
                  <span className="itemIcon" style={{ color: '#5a7a00' }}><Search size={14} /></span>
                  <div className="itemContent">
                    <span className="itemTitle" style={{ color: '#5a7a00', fontWeight: '600' }}>⭐ Save search for "{searchVal}"</span>
                    <span className="itemDetail">Save this query to your account</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="topBarActions">
          {/* Notification Bell */}
          <Link to="/alerts" className="topBarBell" title="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="topBarBadge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>

          {/* User Avatar */}
          <Link to="/profile" className="topBarUser" title="View Profile">
            <div className="userAvatar">{initials}</div>
            <div className="userInfo">
              <span className="userName">{displayName}</span>
              <span className="userRole">{role}</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
