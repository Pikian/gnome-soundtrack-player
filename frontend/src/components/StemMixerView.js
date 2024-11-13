import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StemMixer from './StemMixer';
import './StemMixerView.css';

function StemMixerView() {
  const [trackList, setTrackList] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    // Fetch track list when component mounts
    axios.get(`${process.env.REACT_APP_API_URL}/track-list`)
      .then(response => {
        setTrackList(response.data);
      })
      .catch(error => {
        console.error('Error fetching track list:', error);
      });
  }, []);

  // Get all tracks that have substems
  const getTracksWithStems = () => {
    if (!trackList) return [];

    const tracksWithStems = [];
    Object.entries(trackList).forEach(([section, tracks]) => {
      tracks.forEach(track => {
        if (track?.subtracks?.some(subtrack => subtrack?.filename)) {
          tracksWithStems.push({
            ...track,
            section
          });
        }
      });
    });

    return tracksWithStems;
  };

  return (
    <div className="stem-mixer-view">
      <div className="track-selector">
        <h2>Stem Mixer</h2>
        <p>Select a track to mix its stems:</p>
        <div className="track-list">
          {getTracksWithStems().map(track => (
            <button
              key={track.id}
              className={`track-select-button ${selectedTrack?.id === track.id ? 'active' : ''}`}
              onClick={() => setSelectedTrack(track)}
            >
              <span className="track-title">{track.title}</span>
              <span className="stem-count">
                {track.subtracks.filter(s => s?.filename).length} stems
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedTrack && (
        <div className="mixer-section">
          <StemMixer 
            track={selectedTrack}
            onPlayStateChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export default StemMixerView; 