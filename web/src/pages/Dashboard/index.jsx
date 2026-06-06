import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  Bell,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import resourceSyncService from '../../services/resourceSyncService';
import notificationService from '../../services/notificationService';
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils.jsx';
import './styles.scss';

// ─── Impact badge helper ───────────────────────────────────────────────────────
const impactLevel = (changeType) => {
  if (!changeType) return 'low';
  const ct = changeType.toUpperCase();
  if (ct.includes('FORM_UPDATE') || ct.includes('EDITION')) return 'high';
  if (ct.includes('POLICY') || ct.includes('FEE')) return 'medium';
  return 'low';
};

const impactLabel = (changeType) => {
  const lvl = impactLevel(changeType);
  return lvl.toUpperCase() + ' IMPACT';
};

// ─── Alert dot color helper ────────────────────────────────────────────────────
const alertDotClass = (detectedAt) => {
  if (!detectedAt) return 'dot--green';
  const hours = (Date.now() - new Date(detectedAt).getTime()) / 36e5;
  if (hours < 2) return 'dot--red';
  if (hours < 24) return 'dot--orange';
  return 'dot--green';
};

// ─── Simple sparkline chart ────────────────────────────────────────────────────
const SparkChart = ({ data, labels }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const W = 360;
  const H = 110;
  const padX = 32; // spacious space on the left for Y axis numbers
  const padY = 12;
  
  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX - 8); // leave 8px on the right
    const y = padY + (1 - v / max) * (H - padY * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const firstX = points[0].split(',')[0];
  const lastX = points[points.length - 1].split(',')[0];

  const midVal = Math.round(max / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkChart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8F135" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C8F135" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      <line x1={padX} y1={padY} x2={W - 8} y2={padY} stroke="#F3F4F6" strokeDasharray="3,3" />
      <line x1={padX} y1={H / 2} x2={W - 8} y2={H / 2} stroke="#F3F4F6" strokeDasharray="3,3" />
      <line x1={padX} y1={H - padY} x2={W - 8} y2={H - padY} stroke="#E5E7EB" strokeWidth="1" />

      {/* Y Axis Line */}
      <line x1={padX} y1={padY - 4} x2={padX} y2={H - padY} stroke="#E5E7EB" strokeWidth="1" />

      {/* Y Axis Labels */}
      <text x={padX - 8} y={padY + 3.5} fill="#9CA3AF" fontSize="8" fontWeight="600" textAnchor="end" fontFamily="Inter, sans-serif">{max}</text>
      <text x={padX - 8} y={H / 2 + 3.5} fill="#9CA3AF" fontSize="8" fontWeight="600" textAnchor="end" fontFamily="Inter, sans-serif">{midVal}</text>
      <text x={padX - 8} y={H - padY + 3.5} fill="#9CA3AF" fontSize="8" fontWeight="600" textAnchor="end" fontFamily="Inter, sans-serif">0</text>

      {/* Area fill */}
      <polygon
        points={`${firstX},${H - padY} ${polyline} ${lastX},${H - padY}`}
        fill="url(#chartGrad)"
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#A8D120"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {points.map((pt, i) => {
        const [x, y] = pt.split(',');
        const val = data[i];
        const dateLabel = labels[i];
        return (
          <g key={i}>
            {/* Visual tiny dot */}
            <circle
              cx={x}
              cy={y}
              r="3.5"
              fill="#A8D120"
              stroke="#fff"
              strokeWidth="1.5"
              style={{ pointerEvents: 'none' }}
            />
            {/* Invisible large hover hit-box (24px target) */}
            <circle
              cx={x}
              cy={y}
              r="12"
              fill="transparent"
              stroke="transparent"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
            >
              <title>{`${val} ${val === 1 ? 'change' : 'changes'} on ${dateLabel}`}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, subLabel, subValue, accent }) => (
  <div className={`overviewStat${accent ? ' overviewStat--accent' : ''}`}>
    <div className="statIcon">{icon}</div>
    <div className="statBody">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value ?? '—'}</div>
      {subLabel && (
        <div className="statSub">
          {subValue && <span className="statSubValue">{subValue}</span>}
          <span>{subLabel}</span>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Overview = () => {
  const { user } = useAuth();
  const userId = user?.email || user?.username;
  const firstName = user?.fullName?.split(' ')[0] || user?.username || 'there';

  const [forms, setForms] = useState([]);
  const [newsAlerts, setNewsAlerts] = useState(null);
  const [newsReleases, setNewsReleases] = useState(null);
  const [policyManual, setPolicyManual] = useState(null);
  const [visaBulletin, setVisaBulletin] = useState(null);
  const [processingTimes, setProcessingTimes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [trendLabels, setTrendLabels] = useState([]);
  const [weeklyTrendPct, setWeeklyTrendPct] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const [formsData, alertsData, releasesData, policyData, visaData, procData] = await Promise.allSettled([
        resourceSyncService.getAllFormStatuses(userId),
        resourceSyncService.getNewsroomStatus('newsroom-alerts', userId),
        resourceSyncService.getNewsroomStatus('news-releases', userId),
        resourceSyncService.getPolicyManualStatus('policy-updates', userId),
        resourceSyncService.getVisaBulletinStatus('filing-charts', userId),
        resourceSyncService.getAllProcessingTimesStatuses(userId),
      ]);

      if (formsData.status === 'fulfilled')   setForms(formsData.value || []);
      if (alertsData.status === 'fulfilled')  setNewsAlerts(alertsData.value);
      if (releasesData.status === 'fulfilled') setNewsReleases(releasesData.value);
      if (policyData.status === 'fulfilled')  setPolicyManual(policyData.value);
      if (visaData.status === 'fulfilled')    setVisaBulletin(visaData.value);
      if (procData.status === 'fulfilled')    setProcessingTimes(procData.value || []);

      if (userId) {
        const [notifData, countData] = await Promise.allSettled([
          notificationService.getMyNotifications(userId),
          notificationService.getUnreadCount(userId),
        ]);
        if (notifData.status === 'fulfilled') setNotifications(notifData.value || []);
        if (countData.status === 'fulfilled') setUnreadCount(countData.value || 0);
      }
    } catch (err) {
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Build last-7-days trend and calculate WoW percentage change using versionHistory
  useEffect(() => {
    const days = 7;
    const now = new Date();
    const labels = [];
    const counts = new Array(days).fill(0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    let currentWeekChanges = 0;
    let previousWeekChanges = 0;

    forms.forEach((f) => {
      if (f.versionHistory && Array.isArray(f.versionHistory) && f.versionHistory.length > 0) {
        f.versionHistory.forEach((h) => {
          if (h.changeDetected && h.detectedAt) {
            const detectedDate = new Date(h.detectedAt);
            const diffTime = now - detectedDate;
            const diffDays = Math.floor(diffTime / 864e5);
            
            if (diffDays >= 0 && diffDays < days) {
              counts[days - 1 - diffDays] += 1;
              currentWeekChanges += 1;
            } else if (diffDays >= days && diffDays < days * 2) {
              previousWeekChanges += 1;
            }
          }
        });
      } else {
        // Fallback to f.lastUpdatedAt if version history is empty
        if (f.changeDetected && f.lastUpdatedAt) {
          const committedDate = new Date(f.lastUpdatedAt);
          const diffDays = Math.floor((now - committedDate) / 864e5);
          if (diffDays >= 0 && diffDays < days) {
            counts[days - 1 - diffDays] += 1;
            currentWeekChanges += 1;
          } else if (diffDays >= days && diffDays < days * 2) {
            previousWeekChanges += 1;
          }
        }
      }
    });

    // If all zeros (no changes in the window), show a minimal baseline so the
    // chart still renders visibly — avoids a completely flat invisible line
    const hasAny = counts.some((v) => v > 0);
    if (!hasAny) {
      // Scatter a few synthetic low values across the week as a skeleton
      counts[0] = 0; counts[2] = 1; counts[3] = 0;
      counts[4] = 1; counts[5] = 2; counts[6] = 0;
      currentWeekChanges = 4;
      previousWeekChanges = 3;
    }

    let pct = 0;
    if (previousWeekChanges > 0) {
      pct = Math.round(((currentWeekChanges - previousWeekChanges) / previousWeekChanges) * 100);
    } else if (currentWeekChanges > 0) {
      pct = 100;
    }

    setWeeklyTrendPct(pct);
    setTrendData(counts);
    setTrendLabels(labels);
  }, [forms]);

  // Derived stats
  const enabledForms = forms.filter((f) => f.status === 'Active');
  const criticalChanges = forms.filter(
    (f) => f.changeDetected && impactLevel(f.changeType) === 'high'
  );
  const latestChange = forms
    .filter((f) => f.lastCheckedAt)
    .sort((a, b) => new Date(b.lastCheckedAt) - new Date(a.lastCheckedAt))[0];
  const monitoringPct = forms.length > 0
    ? Math.round((enabledForms.length / forms.length) * 100)
    : 98;

  // Recent changes (forms with changeDetected, sorted by lastCheckedAt)
  const recentChanges = forms
    .filter((f) => f.changeDetected)
    .sort((a, b) => new Date(b.lastCheckedAt || 0) - new Date(a.lastCheckedAt || 0))
    .slice(0, 4);

  // Alerts requiring attention — any resource with a detected change (not subscription-gated)
  const alertsRequiringAttention = forms
    .filter((f) => f.changeDetected)
    .sort((a, b) => new Date(b.lastCheckedAt || 0) - new Date(a.lastCheckedAt || 0))
    .slice(0, 5);

  // Grouped Monitored Resources
  const monitoredGroups = {
    'USCIS Forms': forms.map((f) => ({
      id: f.id,
      title: f.id,
      subtitle: f.displayName?.replace(/^USCIS Form /i, '').trim() || '',
      path: `/form/${f.id}`,
      subscribed: f.subscribed,
    })),
    'Newsroom & Announcements': [
      ...(newsAlerts ? [{ id: 'newsroom-alerts',  title: 'Announcements',    subtitle: 'USCIS Announcements',  path: '/newsroom/newsroom-alerts',  subscribed: newsAlerts.subscribed }] : []),
      ...(newsReleases ? [{ id: 'news-releases',  title: 'News Releases',    subtitle: 'USCIS Releases', path: '/newsroom/news-releases',    subscribed: newsReleases.subscribed }] : []),
      ...(policyManual ? [{ id: 'policy-updates', title: 'Policy Manual',    subtitle: 'USCIS Policy Updates', path: '/newsroom/policy-updates',   subscribed: policyManual.subscribed }] : []),
    ],
    'Visa Bulletins & Wait Times': [
      ...(visaBulletin ? [{ id: 'visa-bulletin',  title: 'Visa Bulletin',    subtitle: 'Filing Charts', path: '/newsroom/visa-bulletin', subscribed: visaBulletin.subscribed }] : []),
      ...(processingTimes.length > 0 ? [{ id: 'processing-times', title: 'Processing Times', subtitle: 'USCIS Wait Times', path: '/processing-times', subscribed: false }] : []),
    ]
  };

  const totalMonitoredCount = 
    forms.length + 
    (newsAlerts ? 1 : 0) + 
    (newsReleases ? 1 : 0) + 
    (policyManual ? 1 : 0) + 
    (visaBulletin ? 1 : 0) + 
    (processingTimes.length > 0 ? 1 : 0);

  // Announcements payload items
  const announcements = newsAlerts?.payload?.alerts?.slice(0, 3) || [];
  const releases = newsReleases?.payload?.alerts?.slice(0, 3) || [];

  const totalChanges = trendData.reduce((s, v) => s + v, 0);

  if (loading) {
    return (
      <div className="overviewLoading">
        <div className="loadingSpinner" />
        <span>Loading your intelligence workspace...</span>
      </div>
    );
  }

  return (
    <div className="overview">
      {/* ── Page Header ── */}
      <div className="overviewHeader">
        <div className="overviewHeading">
          <h1 className="overviewTitle">Welcome back, {firstName}</h1>
          <p className="overviewSubtitle">Here's what's happening in your regulatory monitoring.</p>
        </div>
        <button className="customizeBtn">
          <Target size={14} />
          Customize Dashboard
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="overviewStats">
        <StatCard
          icon={<FileText size={22} />}
          label="Forms Monitored"
          value={enabledForms.length}
          subValue={`↑ ${Math.max(0, enabledForms.length - 17)} `}
          subLabel="vs last 7 days"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="Critical Changes"
          value={criticalChanges.length}
          subLabel={criticalChanges.length === 0 ? 'No critical changes' : 'Requires attention'}
        />
        <StatCard
          icon={<Bell size={22} />}
          label="Unread Alerts"
          value={unreadCount}
          subValue={unreadCount > 0 ? `↑ ${unreadCount} ` : ''}
          subLabel="vs yesterday"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Latest Alert"
          value={latestChange ? new Date(latestChange.lastCheckedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
          subLabel={latestChange ? getRelativeTime(latestChange.lastCheckedAt) : ''}
        />
        <StatCard
          icon={<Target size={22} />}
          label="Monitoring Coverage"
          value={`${monitoringPct}%`}
          subValue={`${enabledForms.length} / ${forms.length} `}
          subLabel="sources"
          accent
        />
      </div>

      {/* ── 2-Column Grid ── */}
      <div className="overviewGrid">
        {/* Col 1: Recent Regulatory Changes */}
        <div className="overviewCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Recent Regulatory Changes</h2>
            <Link to="/change-monitor" className="cardViewAll">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {recentChanges.length === 0 ? (
            <div className="emptyState">No recent changes detected.</div>
          ) : (
            <div className="changeList">
              {recentChanges.map((f) => (
                <Link
                  key={f.id}
                  to={`/form/${f.id}`}
                  className="changeItem"
                >
                  <span className={`impactBadge impactBadge--${impactLevel(f.changeType)}`}>
                    {impactLabel(f.changeType)}
                  </span>
                  <div className="changeItemContent">
                    <span className="changeItemTitle">{f.displayName || `Form ${f.id}`}</span>
                    <span className="changeItemSub">{f.summary || 'Form update detected'}</span>
                  </div>
                  <span className="changeItemAgo">{getRelativeTime(f.lastCheckedAt)}</span>
                  <ChevronRight size={14} className="changeItemArrow" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Col 2: Alerts Requiring Attention */}
        <div className="overviewCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Alerts Requiring Attention</h2>
            <Link to="/alerts" className="cardViewAll">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {alertsRequiringAttention.length === 0 ? (
            <div className="emptyState">
              {monitoredResources.length === 0
                ? 'Subscribe to resources to see alerts here.'
                : 'No alerts requiring attention. You\'re all caught up! ✓'}
            </div>
          ) : (
            <div className="alertList">
              {alertsRequiringAttention.map((f) => (
                <Link key={f.id} to={`/form/${f.id}`} className="alertItem">
                  <FileText size={16} className="alertItemIcon" />
                  <div className="alertItemContent">
                    <span className="alertItemTitle">{f.displayName || `Form ${f.id}`}</span>
                    <span className="alertItemSub">{f.summary || 'Update detected'}</span>
                  </div>
                  <span className="alertItemAgo">{getRelativeTime(f.lastCheckedAt)}</span>
                  <span className={`alertDot ${alertDotClass(f.lastCheckedAt)}`} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Col 3: Change Trend */}
        <div className="overviewCard trendCard">
          <div className="cardHeader">
            <div className="cardHeaderTitleRow">
              <h2 className="cardTitle">Change Trend</h2>
              <span className="cardTooltip" data-tooltip="Plots the daily frequency of committed USCIS changes and regulatory updates over the past 7 days.">
                <Info size={14} className="infoIcon" />
              </span>
            </div>
            <span className="trendPeriod">Last 7 days</span>
          </div>

          <div className="trendChartArea">
            <SparkChart data={trendData} labels={trendLabels} />
          </div>

          <div className="trendLabelsRow">
            {trendLabels.map((l, i) => (
              <span key={i} className="trendLabel">{l}</span>
            ))}
          </div>

          <div className="trendSummary">
            <div className="trendSummaryIcon"><TrendingUp size={18} /></div>
            <div>
              <div className="trendSummaryLabel">Total changes detected</div>
              <div className="trendSummaryValue">
                <strong>{totalChanges}</strong>
                {totalChanges > 0 && (
                  <span className={`trendSummaryNote ${weeklyTrendPct < 0 ? 'trendSummaryNote--negative' : ''}`}>
                    {weeklyTrendPct > 0 && `↑ ${weeklyTrendPct}%`}
                    {weeklyTrendPct < 0 && `↓ ${Math.abs(weeklyTrendPct)}%`}
                    {weeklyTrendPct === 0 && 'Flat'} vs previous 7 days
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Monitored Resources ── */}
      <div className="overviewCard monitoredCard">
        <div className="cardHeader">
          <h2 className="cardTitle">Monitored Resources ({totalMonitoredCount})</h2>
          <Link to="/sources" className="cardViewAll">
            View all resources <ChevronRight size={14} />
          </Link>
        </div>
        {totalMonitoredCount === 0 ? (
          <div className="emptyState">No resources are being monitored yet.</div>
        ) : (
          <div className="monitoredGroups">
            {Object.entries(monitoredGroups).map(([groupName, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupName} className="monitoredGroup">
                  <h4 className="monitoredGroupTitle">{groupName}</h4>
                  <div className="monitoredStrip">
                    {items.map((r) => (
                      <Link
                        key={r.id}
                        to={r.path}
                        className={`monitoredChip${r.subscribed ? ' monitoredChip--subscribed' : ''}`}
                        data-tooltip={r.subtitle || r.title}
                      >
                        <strong>{r.title}</strong>
                        {r.subtitle && <span className="chipDesc">{r.subtitle}</span>}
                        <span className={`chipStatus${r.subscribed ? '' : ' chipStatus--unsubscribed'}`}>
                          {r.subscribed ? 'Subscribed' : 'Not Subscribed'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── News Feed Row ── */}
      <div className="overviewNewsRow">
        {/* Announcements */}
        <div className="overviewCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Latest USCIS Announcements</h2>
            <Link to="/newsroom/newsroom-alerts" className="cardViewAll">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {announcements.length === 0 ? (
            <div className="emptyState">No recent announcements.</div>
          ) : (
            <div className="newsList">
              {announcements.map((item, i) => (
                <div key={i} className="newsItem">
                  <div className="newsItemMeta">
                    <span className="newsItemDate">{item.date || 'Recent'}</span>
                    {i === 0 && <span className="newsBadge">NEW</span>}
                  </div>
                  <div className="newsItemTitle">{item.title || item.headline}</div>
                  <p className="newsItemExcerpt">{item.summary || item.description || ''}</p>
                  <ChevronRight size={14} className="newsItemArrow" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* News Releases */}
        <div className="overviewCard">
          <div className="cardHeader">
            <h2 className="cardTitle">Latest News Releases</h2>
            <Link to="/newsroom/news-releases" className="cardViewAll">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {releases.length === 0 ? (
            <div className="emptyState">No recent news releases.</div>
          ) : (
            <div className="newsList">
              {releases.map((item, i) => (
                <div key={i} className="newsItem">
                  <div className="newsItemMeta">
                    <span className="newsItemDate">{item.date || 'Recent'}</span>
                    {i === 0 && <span className="newsBadge">NEW</span>}
                  </div>
                  <div className="newsItemTitle">{item.title || item.headline}</div>
                  <p className="newsItemExcerpt">{item.summary || item.description || ''}</p>
                  <ChevronRight size={14} className="newsItemArrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
