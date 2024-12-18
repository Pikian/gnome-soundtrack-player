import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaDownload, FaMusic, FaArrowRight, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import axios from 'axios';
import './DeliveryAView.css';

function DeliveryAView() {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/delivery-info`);
        setDeliveryInfo(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching delivery info:', error);
        setError('Failed to load delivery information');
        setLoading(false);
      }
    };

    fetchDeliveryInfo();
  }, []);

  const handleDownload = async (packagePath) => {
    try {
      const [section, type] = packagePath.split('/');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/download-package/${section}/${type}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${section}-${type}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download package');
    }
  };

  if (loading) {
    return (
      <div className="delivery-view">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="delivery-view">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const { deliveryA, deliveryB, sections } = deliveryInfo || {};

  return (
    <div className="delivery-view">
      <div className="delivery-header">
        <div className="header-content">
          <h1>Delivery A</h1>
          <p className="header-subtitle">Foundational Themes & Dynamic Stems</p>
        </div>
        <Link to="/" className="listen-online-link">
          Listen Online <FaArrowRight />
        </Link>
      </div>

      <div className="packages-grid">
        {/* Score Package */}
        <div className="package-card">
          <div className="package-icon">
            <FaMusic />
          </div>
          <div className="package-info">
            <h2>Score</h2>
            <p>Original score from the game, including all stems and variations.</p>
            <div className="package-descriptions">
              <div className="description-item">
                <h4>Dark Forest (Main)</h4>
                <p>An adaptable, dynamic stem package inspired by the mysterious depths of the Dark Forest. Crafted to be both subtly responsive and never repetitive, these stems will shift according to in-game player actions, ensuring the emotional tone always matches the unfolding journey.</p>
              </div>
              <div className="description-item">
                <h4>Dark Forest (Warm)</h4>
                <p>A gentler variation on the core Dark Forest theme, designed for moments of comfort and safety - like home bases or rest areas - bringing a soothing warmth that contrasts with the biome's more ominous undertones.</p>
              </div>
            </div>
            <div className="package-meta">
              <span>{deliveryA?.score?.trackCount || 0} tracks</span>
            </div>
            <div className="track-list-preview">
              <div className="track-item">
                <span className="track-title">The Dark Forest</span>
                <div className="track-actions">
                  <span className="track-stems">20 stems</span>
                </div>
              </div>
              <div className="track-item">
                <span className="track-title">Home Theme</span>
                <div className="track-actions">
                  <span className="track-stems">6 stems</span>
                </div>
              </div>
              <div className="track-item">
                <span className="track-title">Love Theme</span>
              </div>
              <div className="track-item">
                <span className="track-title">Crescent Moon</span>
              </div>
              <div className="track-item">
                <span className="track-title">Magic Hour</span>
              </div>
            </div>
            <div className="download-options">
              <button 
                className="download-button with-stems"
                onClick={() => handleDownload('score/main')}
                title="Download complete score package with all stems"
              >
                <FaDownload /> Download Complete Package
              </button>
            </div>
            <div className="package-note">
              <FaInfoCircle className="info-icon" />
              <p>This package includes all main themes organized in folders, each with their respective stem variations for implementation.</p>
            </div>
          </div>
        </div>

        {/* Gnome Music Package */}
        <div className="package-card">
          <div className="package-icon">
            <FaMusic />
          </div>
          <div className="package-info">
            <h2>Gnome Music</h2>
            <p>Diegetic music and demos, including all variations.</p>
            <div className="package-descriptions">
              <div className="description-item">
                <h4>Ballads of the Brave (Demos)</h4>
                <p>Concept demos of in-game character performances. These ballads, rooted in gnome traditions, carry a gentle sadness that reminds everyone of what has been lost and what is still worth fighting for. They bring quiet strength and hope, encouraging players to keep going. At the same time, we look forward to working with you to make this feature fun—ensuring that playing these tunes in-game isn't just a reflective moment, but also an uplifting, enjoyable part of the gameplay experience.</p>
              </div>
            </div>
            <div className="package-meta">
              <span>{deliveryA?.gnomeMusic?.trackCount || 0} tracks</span>
            </div>
            <div className="track-list-preview">
              <div className="track-item">
                <span className="track-title">Gnome Diegetic I</span>
                <div className="track-actions">
                  <span className="track-stems">1 variation</span>
                </div>
              </div>
              <div className="track-item">
                <span className="track-title">Gnome Diegetic II</span>
              </div>
            </div>
            <div className="download-options">
              <button 
                className="download-button with-stems"
                onClick={() => handleDownload('gnomeMusic/main')}
                title="Download complete gnome music package"
              >
                <FaDownload /> Download Complete Package
              </button>
            </div>
            <div className="package-note">
              <FaInfoCircle className="info-icon" />
              <p>This package includes all diegetic music and demos with their variations for implementation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="delivery-progress">
        <div className="progress-header">
          <h3 className="progress-headline">Progress</h3>
          <span className="update-badge">Update</span>
        </div>
        <p className="progress-update">
          We've updated our project plan to better align narrative themes with evolving gameplay features. 
          By extending our collaboration with Joel and shifting a few pieces around, we're giving ourselves 
          the flexibility to review and refine before finalizing the soundtrack—ensuring the music truly 
          fits the game's unfolding story.
        </p>
        <div className="progress-line">
          <div className="milestone milestone-a active">
            <div className="milestone-dot"></div>
            <div className="milestone-label">
              <span className="milestone-title">Delivery A</span>
              <FaCheckCircle className="milestone-icon" />
            </div>
          </div>
          <div className="milestone milestone-b">
            <div className="milestone-dot"></div>
            <div className="milestone-label">
              <span className="milestone-title">Delivery B</span>
              <span className="milestone-status">In Progress</span>
            </div>
          </div>
        </div>
      </div>

      <div className="future-delivery">
        <div className="future-delivery-header">
          <h3>Delivery B</h3>
          <span className="in-progress-badge">In Progress</span>
        </div>
        <p>
          Already, we have a whole library of pre-composed music ready to be explored. 
          As the game continues to grow and change, we'll find the best place for each track—whether 
          it's a key story moment, a unique character theme, a specific quest, or a memorable location.
        </p>
        <p>
          This is also a chance to refine and reshape these pieces, as well as write new themes where needed. 
          Working together, we can tailor the music so that every theme enriches the player's experience. 
          Expect additional Ballads of the Brave, trailer music, and extra material as our collaboration 
          moves forward. Let's work together to bring your game's world to life through sound.
        </p>

        {/* Bonus & Unassigned Package */}
        {deliveryB?.bonusUnassigned?.trackCount > 0 && (
          <div className="package-card bonus-package">
            <div className="package-icon">
              <FaMusic />
            </div>
            <div className="package-info">
              <h2>Bonus & Unassigned</h2>
              <p>Additional tracks and work in progress material.</p>
              <div className="package-meta">
                <span>{deliveryB.bonusUnassigned.trackCount} tracks</span>
              </div>
            </div>
            <button 
              className="download-button"
              onClick={() => handleDownload('bonusUnassigned')}
              title="Download Bonus Package"
            >
              <FaDownload /> Download ZIP
            </button>
          </div>
        )}
      </div>
      
      <div className="bottom-nav">
        <Link to="/" className="listen-online-link">
          Listen Online <FaArrowRight />
        </Link>
      </div>
    </div>
  );
}

export default DeliveryAView; 