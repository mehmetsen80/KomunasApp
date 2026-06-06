import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Layers,
  FileText,
  Bell,
  BarChart2,
  Search,
  Users,
  Cpu,
  Target,
  Rss,
  Newspaper,
  BookOpen,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import DataToolTip from '../DataToolTip';
import './styles.scss';

const NAV_ITEMS = [
  { type: 'item', icon: <Home size={18} />,       label: 'Overview',       path: '/overview' },
  { type: 'item', icon: <TrendingUp size={18} />, label: 'Change Monitor', path: '/change-monitor' },
  { type: 'item', icon: <Layers size={18} />,     label: 'Sources',        path: '/sources' },
  
  {
    type: 'group',
    id: 'uscis-feeds',
    label: 'USCIS Feeds',
    icon: <Rss size={18} />,
    children: [
      { icon: <Bell size={14} />,      label: 'Newsroom Alerts',  path: '/newsroom/newsroom-alerts' },
      { icon: <Newspaper size={14} />, label: 'News Releases',    path: '/newsroom/news-releases' },
      { icon: <BookOpen size={14} />,  label: 'Policy Updates',   path: '/newsroom/policy-updates' },
      { icon: <Calendar size={14} />,  label: 'Visa Bulletin',    path: '/newsroom/visa-bulletin' },
      { icon: <Clock size={14} />,     label: 'Processing Times', path: '/processing-times' },
    ]
  },

  { type: 'item', icon: <FileText size={18} />,   label: 'Documents',      path: '/documents' },
  { type: 'item', icon: <Bell size={18} />,       label: 'Alerts',         path: '/alerts',   badge: true },
  { type: 'item', icon: <BarChart2 size={18} />,  label: 'Reports',        path: '/reports' },
  { type: 'item', icon: <Search size={18} />,     label: 'Saved Searches', path: '/saved-searches' },
  { type: 'item', icon: <Users size={18} />,      label: 'Team',           path: '/team' },
  { type: 'item', icon: <Cpu size={18} />,        label: 'AI Agents',      path: '/ai-agents' },
];

const Sidebar = ({ unreadCount = 0 }) => {
  const { user } = useAuth();
  const location = useLocation();
  const userId = user?.email || user?.username;
  const [coverage, setCoverage] = useState({
    pct: 98, monitored: 126, total: 128,
    forms: { active: 0, total: 0 },
    feeds: { active: 4, total: 4 },
    proc:  { active: 0, total: 0 },
  });
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        const [formsList, procList] = await Promise.all([
          resourceSyncService.getAllFormStatuses(userId).catch(() => []),
          resourceSyncService.getAllProcessingTimesStatuses(userId).catch(() => []),
        ]);

        const formsCount = formsList.length;
        const activeFormsCount = formsList.filter(f => f.status === 'Active').length;

        // Core news, announcements, policy updates, and visa bulletin charts are monitored in database
        const coreCount = 4;
        
        // Processing times sources
        const procCount = procList.length;
        const activeProcCount = procList.filter(p => p.enabled).length;

        const total     = formsCount + coreCount + procCount;
        const monitored = activeFormsCount + coreCount + activeProcCount;
        const rawPct    = total > 0 ? Math.round((monitored / total) * 100) : 98;
        const pct       = rawPct >= 100 && monitored < total ? 99 : rawPct;

        setCoverage({
          pct, monitored, total,
          forms: { active: activeFormsCount, total: formsCount },
          feeds: { active: coreCount,        total: coreCount },
          proc:  { active: activeProcCount,  total: procCount },
        });
      } catch (err) {
        console.error('Failed to load dynamic coverage:', err);
      }
    };

    fetchCoverage();
  }, [userId]);

  // Auto-expand if a child route is active
  useEffect(() => {
    const hasActiveChild = NAV_ITEMS.some(item => 
      item.type === 'group' && 
      item.children.some(child => location.pathname.startsWith(child.path))
    );
    if (hasActiveChild) {
      setOpenGroups(prev => ({
        ...prev,
        'uscis-feeds': true
      }));
    }
  }, [location.pathname]);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebarBrand">
        <div className="sidebarMark">K</div>
        <div className="sidebarBrandText">
          <span className="sidebarName">Komunas</span>
          <span className="sidebarTagline">Regulatory Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebarNav">
        {NAV_ITEMS.map((item) => {
          if (item.type === 'group') {
            const isGroupActive = item.children.some(child => location.pathname.startsWith(child.path));
            const isGroupOpen = openGroups[item.id];
            
            return (
              <div key={item.id} className="sidebarGroup">
                <div 
                  className={`sidebarGroupHeader ${isGroupActive ? 'sidebarGroupHeader--active' : ''}`}
                  onClick={() => toggleGroup(item.id)}
                >
                  <span className="sidebarItemIcon">{item.icon}</span>
                  <span className="sidebarItemLabel">{item.label}</span>
                  <span className="groupArrow">
                    {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </div>
                {isGroupOpen && (
                  <div className="sidebarGroupChildren">
                    {item.children.map(child => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `sidebarChildItem${isActive ? ' sidebarChildItem--active' : ''}`
                        }
                      >
                        <span className="sidebarChildIcon">{child.icon}</span>
                        <span className="sidebarChildLabel">{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebarItem${isActive ? ' sidebarItem--active' : ''}`
              }
            >
              <span className="sidebarItemIcon">{item.icon}</span>
              <span className="sidebarItemLabel">{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="sidebarBadge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — Monitoring Coverage Card */}
      <div className="sidebarFooter">
        <div className="coverageCard">
          <div className="coverageHeader">
            <Target size={13} className="coverageIcon" />
            <span className="coverageTitle">Active Tracking</span>
          </div>

          {/* Status badge */}
          <div className={`coverageStatus coverageStatus--${
            coverage.pct >= 95 ? 'good' : coverage.pct >= 80 ? 'warn' : 'bad'
          }`}>
            {coverage.pct >= 95 ? '✓ All active' : coverage.pct >= 80 ? '⚠ Some inactive' : '✗ Action needed'}
          </div>

          {/* Per-category breakdown — hover the label to see what's counted */}
          <ul className="coverageBreakdown">
            <li>
              <DataToolTip
                direction="up"
                text={`USCIS immigration forms (e.g. I-129, I-485)\n${coverage.forms.active} actively monitored for status changes\n${coverage.forms.total} total forms tracked`}
              >
                <span className="cbLabel">Forms</span>
              </DataToolTip>
              <span className={`cbValue ${coverage.forms.active < coverage.forms.total ? 'cbValue--warn' : ''}`}>
                {coverage.forms.active}/{coverage.forms.total}
              </span>
            </li>
            <li>
              <DataToolTip
                direction="up"
                text={`USCIS news, policy updates, visa bulletin\n& newsroom alerts feeds\n${coverage.feeds.active} of ${coverage.feeds.total} feeds actively synced`}
              >
                <span className="cbLabel">News &amp; Policy</span>
              </DataToolTip>
              <span className="cbValue">{coverage.feeds.active}/{coverage.feeds.total}</span>
            </li>
            <li>
              <DataToolTip
                direction="up"
                text={`USCIS processing time categories\n(field offices, service centers, form types)\n${coverage.proc.active} of ${coverage.proc.total} categories enabled`}
              >
                <span className="cbLabel">Processing Times</span>
              </DataToolTip>
              <span className={`cbValue ${coverage.proc.active < coverage.proc.total ? 'cbValue--warn' : ''}`}>
                {coverage.proc.active}/{coverage.proc.total}
              </span>
            </li>
          </ul>

          <div className="coverageBar" title={`${coverage.pct}% of sources monitored`}>
            <div className="coverageBarFill" style={{ width: `${coverage.pct}%` }} />
          </div>

          <Link to="/sources" className="coverageBtn">Manage Sources</Link>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
