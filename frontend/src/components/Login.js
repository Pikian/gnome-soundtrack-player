import React, { useState, useEffect } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Automatically log in in development mode
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    }
  }, [onLogin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'bark') {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Incorrect password');
    }
  };

  // Don't render login form in development mode
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Gnome Soundtrack</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">Enter</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
