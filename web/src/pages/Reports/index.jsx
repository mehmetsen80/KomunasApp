import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import resourceSyncService from '../../services/resourceSyncService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import DataToolTip from '../../components/DataToolTip';
import axiosInstance from '../../services/axiosInstance';
import './styles.scss';

const Reports = () => {
  const { user } = useAuth();
  const userId = user?.email || user?.username;

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalMonitored: 0,
    syncRate: 100,
    pendingUpdates: 0,
    activeTracking: 0
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [formsList, procList] = await Promise.all([
          resourceSyncService.getAllFormStatuses(userId).catch(() => []),
          resourceSyncService.getAllProcessingTimesStatuses(userId).catch(() => []),
        ]);

        const aggregated = [];

        // Add Forms
        formsList.forEach(form => {
          aggregated.push({
            id: form.id,
            name: form.displayName || form.id,
            category: 'Form',
            categoryKey: 'form',
            status: form.status === 'Active' ? (form.changeDetected ? 'Pending Update' : 'Synced') : 'Disabled',
            statusKey: form.status === 'Active' ? (form.changeDetected ? 'pending' : 'synced') : 'disabled',
            version: form.version || 'N/A',
            lastChecked: form.lastCheckedAt,
            detail: form.name
          });
        });

        // Add Processing Times
        procList.forEach(proc => {
          const isEnabled = proc.enabled;
          aggregated.push({
            id: proc.resourceId || proc.id,
            name: proc.displayName || 'Processing Times',
            category: 'Processing Times',
            categoryKey: 'proc',
            status: isEnabled ? (proc.changeDetected ? 'Pending Update' : 'Synced') : 'Disabled',
            statusKey: isEnabled ? (proc.changeDetected ? 'pending' : 'synced') : 'disabled',
            version: proc.currentVersion || 'N/A',
            lastChecked: proc.lastCheckedAt,
            detail: `${proc.officeName || ''} - ${proc.formType || ''}`
          });
        });

        // Add Core Feeds (Baseline news/visa feeds)
        const coreFeeds = [
          { id: 'newsroom-alerts', name: 'Newsroom Alerts', detail: 'USCIS Alerts Feed' },
          { id: 'news-releases', name: 'News Releases', detail: 'USCIS News Releases Feed' },
          { id: 'policy-updates', name: 'Policy Updates', detail: 'USCIS Policy Manual updates' },
          { id: 'visa-bulletin', name: 'Visa Bulletin', detail: 'USCIS Visa Bulletin charts' }
        ];

        coreFeeds.forEach(feed => {
          aggregated.push({
            id: feed.id,
            name: feed.name,
            category: 'News & Policy',
            categoryKey: 'news',
            status: 'Synced',
            statusKey: 'synced',
            version: 'Dynamic',
            lastChecked: new Date().toISOString(),
            detail: feed.detail
          });
        });

        setReportData(aggregated);

        // Compute metrics
        const total = aggregated.length;
        const active = aggregated.filter(item => item.statusKey !== 'disabled').length;
        const pending = aggregated.filter(item => item.statusKey === 'pending').length;
        const synced = aggregated.filter(item => item.statusKey === 'synced').length;
        const rate = active > 0 ? Math.round((synced / active) * 100) : 100;

        setMetrics({
          totalMonitored: total,
          syncRate: rate,
          pendingUpdates: pending,
          activeTracking: active
        });

      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [userId]);

  // Apply search and status filters
  const filteredData = reportData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.detail && item.detail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.categoryKey === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.statusKey === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Export to CSV / Backend Generation Function
  const handleExportCSV = async () => {
    try {
      if (filteredData.length === 0) return;

      const payload = {
        totalMonitored: metrics.totalMonitored,
        syncRate: metrics.syncRate,
        pendingUpdates: metrics.pendingUpdates,
        activeTracking: metrics.activeTracking,
        items: filteredData.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
          version: item.version,
          lastChecked: item.lastChecked ? formatDateTime(item.lastChecked) : 'N/A',
          detail: item.detail || ''
        }))
      };

      const response = await axiosInstance.post('/api/reports/export-csv', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Komunas_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to generate CSV. Please try again later.');
    }
  };

  // Export to PDF / Backend Generation Function
  const handleExportPDF = async () => {
    try {
      const payload = {
        totalMonitored: metrics.totalMonitored,
        syncRate: metrics.syncRate,
        pendingUpdates: metrics.pendingUpdates,
        activeTracking: metrics.activeTracking,
        items: filteredData.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
          version: item.version,
          lastChecked: item.lastChecked ? formatDateTime(item.lastChecked) : 'N/A',
          detail: item.detail || ''
        }))
      };

      const response = await axiosInstance.post('/api/reports/export-pdf', payload, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Komunas_Compliance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="reportsPage" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="checkedDate">Loading compliance metrics...</div>
      </div>
    );
  }

  return (
    <div className="reportsPage">
      {/* Page Header */}
      <div className="reportsHeader">
        <div className="reportsHeading">
          <h1 className="reportsTitle">Compliance Reports</h1>
          <p className="reportsSubtitle">Analyze and export regulatory sync metrics, tracked sources, and compliance summaries.</p>
        </div>
        <div className="reportsActions">
          <button className="btnReportExport" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btnReportExport" onClick={handleExportPDF}>
            <FileText size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="reportsStats">
        <div className="statCard">
          <div className="statIcon">
            <BarChart2 size={22} />
          </div>
          <DataToolTip
            direction="up"
            text="Total number of USCIS forms, processing times, and news feeds configured in your system."
          >
            <div className="statContent">
              <span className="statLabel">Total Monitored</span>
              <span className="statValue">{metrics.totalMonitored}</span>
            </div>
          </DataToolTip>
        </div>

        <div className="statCard">
          <div className="statIcon" style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)' }}>
            <CheckCircle2 size={22} />
          </div>
          <DataToolTip
            direction="up"
            text="The percentage of active monitors that are successfully synchronized and up-to-date with USCIS."
          >
            <div className="statContent">
              <span className="statLabel">Sync Rate</span>
              <span className="statValue">{metrics.syncRate}%</span>
            </div>
          </DataToolTip>
        </div>

        <div className="statCard">
          <div className="statIcon" style={{ color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)' }}>
            <AlertTriangle size={22} />
          </div>
          <DataToolTip
            direction="up"
            text="The number of monitors where a new document version or status change has been detected on USCIS, pending local cache update."
          >
            <div className="statContent">
              <span className="statLabel">Pending Updates</span>
              <span className="statValue">{metrics.pendingUpdates}</span>
            </div>
          </DataToolTip>
        </div>

        <div className="statCard">
          <div className="statIcon" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)' }}>
            <Clock size={22} />
          </div>
          <DataToolTip
            direction="up"
            text="The number of monitors currently enabled to run background check schedules (excluding disabled/muted monitors)."
          >
            <div className="statContent">
              <span className="statLabel">Active Syncing</span>
              <span className="statValue">{metrics.activeTracking}</span>
            </div>
          </DataToolTip>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="reportsFilterBar">
        <div className="searchWrapper">
          <Search size={18} className="searchIcon" />
          <input 
            type="text" 
            placeholder="Search resources, forms, details..." 
            className="searchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filterControls">
          <div className="filterGroup">
            <label>Category</label>
            <select 
              className="filterSelect"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="form">Forms</option>
              <option value="news">News & Policy</option>
              <option value="proc">Processing Times</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>Status</label>
            <select 
              className="filterSelect"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="synced">Synced</option>
              <option value="pending">Pending Update</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {filteredData.length > 0 ? (
        <div className="reportsTableWrapper">
          <table className="reportsTable">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Version</th>
                <th>Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={`${item.categoryKey}-${item.id}`}>
                  <td className="reportNameCell">
                    <span className="reportName">{item.name}</span>
                    <span className="reportDesc">{item.detail}</span>
                  </td>
                  <td>
                    <span className={`categoryBadge categoryBadge--${item.categoryKey}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <span className={`statusLabel statusLabel--${item.statusKey}`}>
                      <span className="statusDot"></span>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.version}</td>
                  <td>{item.lastChecked ? formatDateTime(item.lastChecked) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="reportsEmptyCard">
          <Search size={48} style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
          <h3>No matching records found</h3>
          <p>Try refining your search terms or adjusting the category/status filters.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
