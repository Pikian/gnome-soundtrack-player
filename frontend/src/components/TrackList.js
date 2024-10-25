import React, { useEffect, useState } from 'react';































import axios from 'axios';































import { FaPlay, FaPause, FaMusic } from 'react-icons/fa'; // Install with: npm install react-icons































import './TrackList.css';































































function TrackList({ onPlayTrack, currentTrack }) {
  const [tracks, setTracks] = useState([]);
  const [albumCover, setAlbumCover] = useState(null);
  const [albumInfo] = useState({
    title: "Gnome - The Story of a Revel",
    subtitle: "Original Soundtrack",
    composer: "Joel Lyssarides",
    year: "2024"
  });

  const calculateTotalDuration = (tracks) => {
    const totalSeconds = tracks.reduce((total, track) => {
      const [minutes, seconds] = track.duration.split(':');
      return total + (parseInt(minutes) * 60) + parseInt(seconds);
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min ${seconds} sec`;
  };

  useEffect(() => {
    console.log('API URL:', process.env.REACT_APP_API_URL);
    
    // Fetch tracks
    axios.get(`${process.env.REACT_APP_API_URL}/tracks`)
      .then(response => {
        console.log('Full tracks response:', response);
        if (Array.isArray(response.data)) {
          setTracks(response.data);
        } else {
          console.error('Unexpected tracks response:', response.data);
        }
      })
      .catch(error => {
        console.error('Detailed tracks error:', {
          message: error.message,
          response: error.response,
          request: error.request,
          config: error.config
        });
      });

    // Fetch album info
    axios.get(`${process.env.REACT_APP_API_URL}/album-info`)
      .then(response => {
        console.log('Album info response:', response.data);
        if (response.data.coverImage) {
          setAlbumCover(`${process.env.REACT_APP_API_URL}${response.data.coverImage}`);
        }
      })
      .catch(error => {
        console.error('Error fetching album info:', error);
      });
  }, []);

  const totalDuration = calculateTotalDuration(tracks);

  return (
    <div className="album-view">
      <div className="album-header">
        <div className="album-cover">
          {albumCover ? (
            <img src={albumCover} alt="Album Cover" className="album-image" />
          ) : (
            <div className="album-placeholder">
              <FaMusic className="album-icon" />
            </div>
          )}
        </div>
        <div className="album-info">
          <span className="album-type">SOUNDTRACK</span>
          <h1>{albumInfo.title}</h1>
          <h2>{albumInfo.subtitle}</h2>
          <div className="album-details">
            <span className="composer">{albumInfo.composer}</span>
            <span className="dot">•</span>
            <span className="year">{albumInfo.year}</span>
            <span className="dot">•</span>
            <span className="track-count">{tracks.length} songs</span>
            <span className="dot">•</span>
            <span className="total-duration">{totalDuration}</span>
          </div>
        </div>
      </div>

      <div className="tracks-table">
        <div className="tracks-header">
          <div className="track-number">#</div>
          <div className="track-title">Title</div>
          <div className="track-duration">Duration</div>
        </div>
        {tracks.map((track, index) => (
          <div 
            key={track.id}
            className={`track-row ${currentTrack?.id === track.id ? 'playing' : ''}`}
            onClick={() => onPlayTrack(track)}
          >
            <div className="track-number">
              {currentTrack?.id === track.id ? 
                <FaPause className="play-icon" /> : 
                <FaPlay className="play-icon" />
              }
              <span className="number">{index + 1}</span>
            </div>
            <div className="track-title">{track.name}</div>
            <div className="track-duration">{track.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackList;
