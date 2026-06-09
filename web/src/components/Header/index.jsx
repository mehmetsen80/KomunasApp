import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, LogIn, UserPlus, Bell, Rss, BookOpen, BarChart3, Menu, X, ChevronDown, Settings, Activity, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import notificationService from '../../services/notificationService';
import LogoutConfirmationModal from '../Modals/LogoutConfirmationModal';
import './styles.scss';

const Header = ({ transparent = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userMenuRef = useRef(null);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className={`header ${transparent ? 'transparent' : ''} ${isMenuOpen ? 'menuOpen' : ''}`}>
        <div className="container headerContainer">
          <div className="headerTopRow">
            <Link to="/" className="headerLogo" onClick={() => setIsMenuOpen(false)}>
              <img src="/komunas_logo.svg" alt="Komunas" className="headerLogoIcon" />
              Komunas
            </Link>

            <button className="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className={`headerActions ${isMenuOpen ? 'open' : ''}`}>
              {isAuthenticated ? (
                <div className="authActionsGroup">
                  <Link to="/notifications" className="navIconLink" title="Notifications" onClick={() => setIsMenuOpen(false)}>
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="unreadBadge">{unreadCount}</span>}
                  </Link>

                  <div className="userMenuWrapper" ref={userMenuRef}>
                    <button
                      className={`userProfileTrigger ${isUserMenuOpen ? 'active' : ''}`}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <div className="avatar">
                        {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="userName">{user?.fullName || user?.username}</span>
                      <ChevronDown size={14} className={`chevron ${isUserMenuOpen ? 'rotate' : ''}`} />
                    </button>

                    {isUserMenuOpen && (
                      <div className="userDropdown">
                        <div className="dropdownHeader">
                          <p className="userEmail">{user?.email}</p>
                        </div>
                        <div className="dropdownDivider"></div>
                        <Link to="/profile" className="dropdownItem" onClick={() => setIsUserMenuOpen(false)}>
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
                </div>
              ) : (
                <div className="guestActions">
                  <Link to="/register" className="registerBtn" onClick={() => setIsMenuOpen(false)}>
                    <UserPlus size={18} />
                    Register
                  </Link>
                  <Link to="/login" className="loginBtn" onClick={() => setIsMenuOpen(false)}>
                    <LogIn size={18} />
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>

          <nav className={`navLinks ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/" className={`navLink ${currentPath === '/' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <Home size={15} />
              Home
            </Link>
            
            <Link to="/newsroom/newsroom-alerts" className={`navLink ${currentPath === '/newsroom/newsroom-alerts' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <Rss size={15} />
              Announcements
            </Link>
            <Link to="/newsroom/news-releases" className={`navLink ${currentPath === '/newsroom/news-releases' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <Rss size={15} />
              Releases
            </Link>
            <Link to="/newsroom/policy-updates" className={`navLink ${currentPath === '/newsroom/policy-updates' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <BookOpen size={15} />
              Policy Updates
            </Link>
            <Link to="/newsroom/visa-bulletin" className={`navLink ${currentPath === '/newsroom/visa-bulletin' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <BarChart3 size={15} />
              Visa Bulletin
            </Link>

            <Link to="/processing-times" className={`navLink ${currentPath === '/processing-times' ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <Activity size={15} />
              Processing Times
            </Link>
          </nav>
        </div>
      </header>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Header;
