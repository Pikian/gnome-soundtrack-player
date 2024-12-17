import React from 'react';
import { Link } from 'react-router-dom';
import { FaDownload, FaMusic, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import './DeliveryAView.css';

function DeliveryAView() {
  const packages = [
    {
      id: 'dark-forest-main',
      title: 'Dark Forest (Main)',
      description: 'An adaptable, dynamic stem package inspired by the mysterious depths of the Dark Forest. Crafted to be both subtly responsive and never repetitive, these stems will shift according to in-game player actions, ensuring the emotional tone always matches the unfolding journey.',
      tracks: 12,
      duration: '24:35'
    },
    {
      id: 'dark-forest-warm',
      title: 'Dark Forest (Warm)',
      description: 'A gentler variation on the core Dark Forest theme, designed for moments of comfort and safety - like home bases or rest areas - bringing a soothing warmth that contrasts with the biome\'s more ominous undertones.',
      tracks: 8,
      duration: '16:40'
    },
    {
      id: 'ballads-brave',
      title: 'Ballads of the Brave (Demos)',
      description: 'Concept demos of in-game character performances. These ballads, rooted in gnome traditions, carry a gentle sadness that reminds everyone of what has been lost and what is still worth fighting for. They bring quiet strength and hope, encouraging players to keep going. At the same time, we look forward to working with you to make this feature fun—ensuring that playing these tunes in-game isn’t just a reflective moment, but also an uplifting, enjoyable part of the gameplay experience.',
      tracks: 6,
      duration: '14:20'
    }
  ];

  const handleDownload = (packageId) => {
    const downloadUrl = `${process.env.REACT_APP_API_URL}/download/${packageId}`;
    window.open(downloadUrl, '_blank');
  };

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
        {packages.map(pkg => (
          <div key={pkg.id} className="package-card">
            <div className="package-icon">
              <FaMusic />
            </div>
            <div className="package-info">
              <h2>{pkg.title}</h2>
              <p>{pkg.description}</p>
              <div className="package-meta">
                <span>{pkg.tracks} tracks</span>
                <span className="dot">•</span>
                <span>{pkg.duration}</span>
              </div>
            </div>
            <button 
              className="download-button"
              onClick={() => handleDownload(pkg.id)}
              title={`Download ${pkg.title}`}
            >
              <FaDownload /> Download ZIP
            </button>
          </div>
        ))}
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