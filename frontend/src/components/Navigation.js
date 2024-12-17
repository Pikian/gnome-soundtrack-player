import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-links">
        <div className="nav-left">
          <img src="/assets/trollheim-logo.png" alt="Trollheim Logo" className="nav-logo" />
          <div className="desktop-nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Library
            </Link>
            <Link 
              to="/stems" 
              className={`nav-link ${location.pathname === '/stems' ? 'active' : ''}`}
            >
              Stem Mixer
            </Link>
          </div>
        </div>
        <div className="nav-right">
          <Link 
            to="/delivery-a" 
            className={`nav-link ${location.pathname === '/delivery-a' ? 'active' : ''}`}
          >
            Delivery A
          </Link>
          <Link 
            to="/manage" 
            className={`nav-link settings-link ${location.pathname === '/manage' ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </Link>
        </div>

        {/* Hamburger button */}
        <button className="hamburger-button" onClick={toggleMenu}>
          <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          Library
        </Link>
        <Link 
          to="/stems" 
          className={`nav-link ${location.pathname === '/stems' ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          Stem Mixer
        </Link>
        <Link 
          to="/delivery-a" 
          className={`nav-link ${location.pathname === '/delivery-a' ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          Delivery A
        </Link>
        <Link 
          to="/manage" 
          className={`nav-link ${location.pathname === '/manage' ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
