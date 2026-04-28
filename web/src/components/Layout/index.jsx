import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import './styles.scss';

const Layout = () => {
  return (
    <div className="layoutWrapper">
      <Sidebar />
      <div className="mainContent">
        <Header />
        <main className="pageBody">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
