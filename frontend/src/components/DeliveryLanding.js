import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DeliveryLanding.css';

function DeliveryLanding({ onClose }) {
  const [albumCover, setAlbumCover] = useState(null);

  useEffect(() => {
    // Fetch album cover when component mounts
    axios.get(`${process.env.REACT_APP_API_URL}/album-info`)
      .then(response => {
        if (response.data.coverImage) {
          setAlbumCover(`${process.env.REACT_APP_API_URL}${response.data.coverImage}`);
        }
      })
      .catch(error => {
        console.error('Error fetching album cover:', error);
      });
  }, []);

  const categories = [
    {
      title: "Score",
      description: "Original score from the game",
      downloadLink: "/downloads/score.zip"
    },
    {
      title: "Gnome Music",
      description: "Diegetic music from the gnome world",
      downloadLink: "/downloads/gnome-music.zip"
    },
    {
      title: "Outside Scope",
      description: "Additional music and bonus tracks",
      downloadLink: "/downloads/outside-scope.zip"
    }
  ];

  return (
    <div className="delivery-landing">
      <div className="delivery-content" style={{
        backgroundImage: albumCover ? `url(${albumCover})` : 'none',
      }}>
        <div className="delivery-overlay">
          <div className="logo-container">
            <img src="/logo.png" alt="Gnome - The Story of a Revel" className="logo" />
          </div>
          <h1>Delivery A</h1>
          <p>First delivery of the soundtrack for Gnome - The Story of a Revel</p>
          
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-card">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <a href={category.downloadLink} className="download-link">
                  Download
                  <i className="fas fa-download"></i>
                </a>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="enter-button">
            Enter Library
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryLanding; 