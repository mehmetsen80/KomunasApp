import React from 'react';
import './styles.scss';

const Footer = () => {
  return (
    <footer className="appFooter">
      <div className="footerContent">
        <div className="footerBrand">
          <span className="footerName">Powered by Linqra AI</span>
          <img src="/linqra.svg" alt="Linqra" className="footerLogo" />
        </div>
        <p className="footerCopy">
          &copy; {new Date().getFullYear()} Linqra &bull; Independent monitoring of USCIS resource updates.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
