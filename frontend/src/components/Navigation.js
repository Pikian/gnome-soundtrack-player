import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-links">
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
          <span className="new-tag">New</span>
        </Link>
        <Link 
          to="/manage" 
          className={`nav-link ${location.pathname === '/manage' ? 'active' : ''}`}
        >
          Track Manager
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
