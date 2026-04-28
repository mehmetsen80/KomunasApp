import React from 'react';
import { Search, User, LogOut } from 'lucide-react';
import './styles.scss';

const Header = () => {
  return (
    <header className="header">
      <div className="searchBar">
        <Search size={18} className="searchIcon" />
        <input type="text" placeholder="Search resources..." className="searchInput" />
      </div>

      <div className="actions">
        <div className="userProfile">
          <div className="userInfo">
            <span className="userName">Mehmet Sen</span>
            <span className="userRole">Admin</span>
          </div>
          <div className="avatar">
            <User size={20} />
          </div>
        </div>
        
        <button className="logoutBtn" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
