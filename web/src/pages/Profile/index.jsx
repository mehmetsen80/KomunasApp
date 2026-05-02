import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, Calendar, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import './styles.scss';
import HeroBackground from '../../components/HeroBackground';
import { formatDateTime } from '../../utils/dateUtils';

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="profilePage">
      <HeroBackground />
      
      <div className="profileContainer">
        <Link to="/" className="backBtn">
          <ArrowLeft size={18} />
          Back to Library
        </Link>

        <div className="profileCard">
          <div className="profileHeader">
            <div className="avatarLarge">
              {user.fullName?.charAt(0) || user.username?.charAt(0)}
            </div>
            <div className="headerInfo">
              <h1>{user.fullName}</h1>
              <p className="usernameTag">@{user.username}</p>
            </div>
          </div>

          <div className="profileContent">
            <div className="infoSection">
              <div className="infoItem">
                <div className="iconBox">
                  <Mail size={20} />
                </div>
                <div className="details">
                  <label>Email Address</label>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="infoItem">
                <div className="iconBox">
                  <Shield size={20} />
                </div>
                <div className="details">
                  <label>Assigned Roles</label>
                  <div className="roleTags">
                    {user.roles?.map(role => (
                      <span key={role} className="roleTag">{role}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="infoItem">
                <div className="iconBox">
                  <Calendar size={20} />
                </div>
                <div className="details">
                  <label>Member Since</label>
                  <span>{user.createdAt ? formatDateTime(user.createdAt) : 'Founding Member'}</span>
                </div>
              </div>
            </div>

            <div className="actionSection">
              <button onClick={logout} className="logoutAction">
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="footer">
          <p>© {new Date().getFullYear()} Komunas. Professional Identity Verified.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
