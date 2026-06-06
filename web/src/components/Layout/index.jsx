import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Header from '../Header';
import Footer from '../Footer';
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
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
