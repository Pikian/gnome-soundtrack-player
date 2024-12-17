import React from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './MilestoneDelivery.css';

function MilestoneDelivery() {
  const navigate = useNavigate();

  const handleDownload = async (packageName) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/download-package/${packageName}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${packageName}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download package');
    }
  };

  return (
    <div className="milestone-delivery">
      <div className="milestone-header">
        <h1>Milestone A</h1>
        <p className="delivery-description">
          Download complete music packages or explore our digital library to listen to individual tracks.
        </p>
      </div>

      <div className="packages">
        <div className="package-card">
          <h2>The Dark Forest (Main)</h2>
          <p>Dynamic stem package for the main game experience.</p>
          <p className="package-type">Dynamic Stem Package</p>
          <button 
            onClick={() => handleDownload('dark-forest-main')}
            className="download-button"
          >
            Download Package
          </button>
        </div>

        <div className="package-card">
          <h2>The Dark Forest (Warm)</h2>
          <p>Alternative dynamic stem package, perfect for building phases or when players are more comfortable.</p>
          <p className="package-type">Dynamic Stem Package</p>
          <button 
            onClick={() => handleDownload('dark-forest-warm')}
            className="download-button"
          >
            Download Package
          </button>
        </div>

        <div className="package-card">
          <h2>Gnome Diegetic</h2>
          <p>Authentic instrument music played by the Gnomes themselves.</p>
          <p className="package-type">Diegetic Music Package</p>
          <button 
            onClick={() => handleDownload('gnome-diegetic')}
            className="download-button"
          >
            Download Package
          </button>
        </div>
      </div>

      <div className="library-section">
        <p>Want to preview the tracks before downloading?</p>
        <button 
          className="browse-library-button"
          onClick={() => navigate('/')}
        >
          Browse Digital Library
        </button>
      </div>

      <div className="coming-soon-section">
        <div className="milestone-divider">
          <span>Coming Soon</span>
        </div>
        <div className="future-milestone">
          <h2>Milestone B</h2>
          <div className="tooltip">
            <span className="tooltip-trigger">?</span>
            <div className="tooltip-content">
              Details about Milestone B will be available soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MilestoneDelivery; 