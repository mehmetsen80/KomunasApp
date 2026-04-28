import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Bell, Shield } from 'lucide-react';
import './styles.scss';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FileText size={20} />, label: 'Forms & Docs', path: '/forms' },
    { icon: <Shield size={20} />, label: 'Sentinel Alerts', path: '/alerts' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logoContainer">
          <img src="/logo.jpg" alt="Komunas Logo" className="logoImg" />
          <div className="shineEffect"></div>
        </div>
        <span className="logoText">KOMUNAS</span>
      </div>
      
      <nav className="nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => isActive ? "navItem active" : "navItem"}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="footer">
        <div className="version">v0.1.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;
