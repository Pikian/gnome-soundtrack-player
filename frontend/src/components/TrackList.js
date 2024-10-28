import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaMusic, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'; // Install with: npm install react-icons
import './TrackList.css';

function TrackList({ onPlayTrack, currentTrack }) {
  const [tracks, setTracks] = useState([]);
  const [trackList, setTrackList] = useState(null);
  const [albumCover, setAlbumCover] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const [albumInfo] = useState({
    title: "Gnome - The Story of a Revel",
    subtitle: "Original Soundtrack",
    composer: "Joel Lyssarides",
    year: "2024"
  });

  const calculateTotalDuration = (tracks) => {
    const totalSeconds = tracks.reduce((total, track) => {
      return total + (track.rawDuration || 0);
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min ${seconds.toString().padStart(2, '0')} sec`;
  };

  useEffect(() => {
    console.log('API URL:', process.env.REACT_APP_API_URL);
    
    // Fetch both tracks and track list
    Promise.all([
      axios.get(`${process.env.REACT_APP_API_URL}/tracks`),
      axios.get(`${process.env.REACT_APP_API_URL}/track-list`),
      axios.get(`${process.env.REACT_APP_API_URL}/album-info`)
    ]).then(([tracksRes, trackListRes, albumInfoRes]) => {
      console.log('Tracks API Response:', tracksRes.data);
      console.log('Track List Response:', trackListRes.data);
      
      setTracks(tracksRes.data);
      setTrackList(trackListRes.data);
      
      if (albumInfoRes.data.coverImage) {
        setAlbumCover(`${process.env.REACT_APP_API_URL}${albumInfoRes.data.coverImage}`);
      }
    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, []);

  // Update the getAllTracks function
  const getAllTracks = () => {
    if (!trackList) return [];
    
    const allTracks = [
      ...trackList.score,
      ...trackList.gnomeMusic,
      ...trackList.outsideScope
    ];

    // Sort tracks: ready first, then planned
    return allTracks.sort((a, b) => {
      const statusOrder = { ready: 0, planned: 1 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };

  const handleTrackClick = (track) => {
    if (!track.filename) return; // Don't handle clicks for tracks without files
    
    if (currentTrack?.id === track.id) {
      const audioElement = document.querySelector('.rhap_main-controls-button');
      if (audioElement) {
        audioElement.click();
        setIsPlaying(!isPlaying);
      }
    } else {
      onPlayTrack({
        ...track,
        name: track.title // Use title from trackList instead of filename
      });
      setIsPlaying(true);
    }
  };

  const sortTracks = (tracks, sortConfig) => {
    if (!sortConfig.key) return tracks;

    return [...tracks].sort((a, b) => {
      if (sortConfig.key === 'duration') {
        const aDuration = a.rawDuration || 0;
        const bDuration = b.rawDuration || 0;
        return sortConfig.direction === 'asc' ? aDuration - bDuration : bDuration - aDuration;
      }

      if (sortConfig.key === 'title') {
        return sortConfig.direction === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }

      if (sortConfig.key === 'status') {
        const statusOrder = { ready: 1, planned: 2 };
        const aOrder = statusOrder[a.status] || 999;
        const bOrder = statusOrder[b.status] || 999;
        return sortConfig.direction === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }

      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="sort-icon active" /> : 
      <FaSortDown className="sort-icon active" />;
  };

  const allTracks = getAllTracks();
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
          <div 
            className="track-title sortable"
            onClick={() => requestSort('title')}
          >
            Title {getSortIcon('title')}
          </div>
          <div 
            className="track-duration sortable"
            onClick={() => requestSort('duration')}
          >
            Duration {getSortIcon('duration')}
          </div>
          <div 
            className="track-status sortable"
            onClick={() => requestSort('status')}
          >
            Status {getSortIcon('status')}
          </div>
        </div>
        
        {/* Score section */}
        {sortTracks(trackList?.score || [], sortConfig).map((track, index) => {
          // Find matching track from tracks array to get duration
          const trackFile = tracks.find(t => t.filename === track.filename);
          const duration = trackFile?.duration || '--:--';
          
          return (
            <div 
              key={track.id}
              className={`track-row ${track.status} ${currentTrack?.id === track.id ? 'playing' : ''} ${!track.filename ? 'unavailable' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">
                {track.filename ? (
                  currentTrack?.id === track.id ? 
                    (isPlaying ? <FaPause className="play-icon" /> : <FaPlay className="play-icon" />) : 
                    <FaPlay className="play-icon" />
                ) : (
                  <span className="track-status-icon">
                    {track.status === 'in_progress' ? '⏳' : '📝'}
                  </span>
                )}
                <span className="number">{index + 1}</span>
              </div>
              <div className="track-title">{track.title}</div>
              <div className="track-duration">
                {duration}
              </div>
              <div className="track-status">
                {track.filename ? 'Ready' : 'Planned'}
              </div>
            </div>
          );
        })}
        
        {/* Divider for Gnome Music */}
        <div className="section-divider">
          <h3>Gnome Music</h3>
        </div>
        
        {/* Gnome Music section */}
        {sortTracks(trackList?.gnomeMusic || [], sortConfig).map((track, index) => {
          // Find matching track from tracks array to get duration
          const trackFile = tracks.find(t => t.filename === track.filename);
          const duration = trackFile?.duration || '--:--';
          
          return (
            <div 
              key={track.id}
              className={`track-row ${track.status} ${currentTrack?.id === track.id ? 'playing' : ''} ${!track.filename ? 'unavailable' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">
                {track.filename ? (
                  currentTrack?.id === track.id ? 
                    (isPlaying ? <FaPause className="play-icon" /> : <FaPlay className="play-icon" />) : 
                    <FaPlay className="play-icon" />
                ) : (
                  <span className="track-status-icon">
                    {track.status === 'in_progress' ? '⏳' : '📝'}
                  </span>
                )}
                <span className="number">{index + 1}</span>
              </div>
              <div className="track-title">{track.title}</div>
              <div className="track-duration">
                {duration}
              </div>
              <div className="track-status">
                {track.filename ? 'Ready' : 'Planned'}
              </div>
            </div>
          );
        })}
        
        {/* Divider for Outside Scope */}
        <div className="section-divider">
          <h3>Outside Current Scope</h3>
        </div>
        
        {/* Outside Scope section */}
        {sortTracks(trackList?.outsideScope || [], sortConfig).map((track, index) => {
          // Find matching track from tracks array to get duration
          const trackFile = tracks.find(t => t.filename === track.filename);
          const duration = trackFile?.duration || '--:--';
          
          return (
            <div 
              key={track.id}
              className={`track-row ${track.status} ${currentTrack?.id === track.id ? 'playing' : ''} ${!track.filename ? 'unavailable' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">
                {track.filename ? (
                  currentTrack?.id === track.id ? 
                    (isPlaying ? <FaPause className="play-icon" /> : <FaPlay className="play-icon" />) : 
                    <FaPlay className="play-icon" />
                ) : (
                  <span className="track-status-icon">
                    {track.status === 'in_progress' ? '⏳' : '📝'}
                  </span>
                )}
                <span className="number">{index + 1}</span>
              </div>
              <div className="track-title">{track.title}</div>
              <div className="track-duration">
                {duration}
              </div>
              <div className="track-status">
                {track.filename ? 'Ready' : 'Planned'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrackList;
