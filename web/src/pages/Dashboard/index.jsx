import React from 'react';
import { Activity, ShieldCheck, FileCheck, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';
import './styles.scss';

const Dashboard = () => {
  const stats = [
    { label: 'Active Monitors', value: '42', icon: <Activity size={24} />, color: '#4facfe' },
    { label: 'Verified Forms', value: '128', icon: <FileCheck size={24} />, color: '#00f2fe' },
    { label: 'Health Status', value: '99.8%', icon: <ShieldCheck size={24} />, color: '#43e97b' },
    { label: 'Last Sync', value: '2m ago', icon: <Clock size={24} />, color: '#fa709a' },
  ];

  const recentAlerts = [
    { id: 1, form: 'I-485', type: 'Edition Update', date: '2026-04-26 14:20', status: 'Synced' },
    { id: 2, form: 'I-130', type: 'Instruction Change', date: '2026-04-26 12:05', status: 'Verified' },
    { id: 3, form: 'N-400', type: 'Form Re-scan', date: '2026-04-26 09:15', status: 'Self-Healed' },
  ];

  return (
    <div className="dashboard">
      <header className="pageHeader">
        <h1 className="gradient-text">Sentinel Overview</h1>
        <p>Real-time monitoring of USCIS resource integrity.</p>
      </header>

      <section className="statsGrid">
        {stats.map((stat, i) => (
          <div key={i} className="glass statCard">
            <div className="statInfo">
              <span className="statLabel">{stat.label}</span>
              <span className="statValue">{stat.value}</span>
            </div>
            <div className="statIcon" style={{ color: stat.color, background: `${stat.color}15` }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </section>

      <div className="mainGrid">
        <section className="glass activitySection">
          <div className="sectionHeader">
            <h3>Recent Sentinel Activity</h3>
            <button className="viewAll">View History <ArrowUpRight size={16} /></button>
          </div>
          <div className="tableWrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Form ID</th>
                  <th>Change Type</th>
                  <th>Detected At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="formCell">{alert.form}</td>
                    <td>{alert.type}</td>
                    <td className="dateCell">{alert.date}</td>
                    <td>
                      <span className={`badge ${alert.status.toLowerCase().replace('-', '')}`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass statusSection">
          <div className="sectionHeader">
            <h3>System Health</h3>
          </div>
          <div className="healthInfo">
            <div className="healthItem">
              <div className="healthLabel">
                <ShieldCheck size={18} />
                <span>Core Scraper</span>
              </div>
              <div className="healthStatus">Operational</div>
            </div>
            <div className="healthItem">
              <div className="healthLabel">
                <Activity size={18} />
                <span>Hub Sync</span>
              </div>
              <div className="healthStatus">Active</div>
            </div>
            <div className="healthItem">
              <div className="healthLabel">
                <AlertCircle size={18} />
                <span>Pending Repairs</span>
              </div>
              <div className="healthStatus">0</div>
            </div>
          </div>
          <div className="healthChartPlaceholder">
             <div className="pulseLine"></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
