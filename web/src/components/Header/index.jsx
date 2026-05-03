import React from 'react';
import { User, LogOut, LogIn, UserPlus, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import './styles.scss';

const Header = ({ transparent = false }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const count = await notificationService.getUnreadCount(user.email.toLowerCase());
          setUnreadCount(count);
        } catch (err) {
          console.error('Failed to fetch notifications for badge:', err);
        }
      }
    };

    fetchUnread();
    // Poll every 1 minute for updates
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <header className={`header ${transparent ? 'transparent' : ''}`}>
      <div className="headerActions">
        {isAuthenticated ? (
          <>
            <Link to="/notifications" className="navIconLink" title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && <span className="unreadBadge">{unreadCount}</span>}
            </Link>
            <Link to="/profile" className="userProfile">
              <User size={18} />
              <span>{user?.fullName || user?.username}</span>
            </Link>
            <button onClick={logout} className="logoutBtn">
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="registerBtn">
              <UserPlus size={18} />
              Register
            </Link>
            <Link to="/login" className="loginBtn">
              <LogIn size={18} />
              Login
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
