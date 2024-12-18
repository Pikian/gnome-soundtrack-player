import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaMusic, FaSort, FaSortUp, FaSortDown, FaPlayCircle, FaChevronDown, FaChevronRight, FaDownload } from 'react-icons/fa';
import './TrackList.css';

function TrackList({ onPlayTrack, currentTrack, isPlaying: playerIsPlaying, trackListData, onPlayStateChange }) {
  const [tracks, setTracks] = useState([]);
  const [trackList, setTrackList] = useState(null);
  const [albumCover, setAlbumCover] = useState(null);
  const [expandedTracks, setExpandedTracks] = useState(new Set());
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
    let totalSeconds = 0;

    // Helper function to process a track and its subtracks
    const processTrack = (track) => {
      if (!track) return;

      const trackFile = tracks.find(t => t.filename === track.filename);
      if (trackFile?.rawDuration) {
        totalSeconds += trackFile.rawDuration;
      }

      // Process subtracks if they exist
      if (track.subtracks) {
        track.subtracks.forEach(subtrack => {
          if (subtrack) {
            const subtrackFile = tracks.find(t => t.filename === subtrack.filename);
            if (subtrackFile?.rawDuration) {
              totalSeconds += subtrackFile.rawDuration;
            }
          }
        });
      }
    };

    // Process all tracks in each section
    if (trackList) {
      Object.values(trackList).forEach(section => {
        section.filter(track => track).forEach(processTrack);
      });
    }
    
    // Format the total duration
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

  useEffect(() => {
    if (trackListData) {
      setTrackList(trackListData);
    }
  }, [trackListData]);

  // Update the getAllTracks function
  const getAllTracks = () => {
    if (!trackList) return [];
    
    // Get only main tracks (no subtracks)
    const allTracks = [
      ...trackList.score.filter(track => track && !track.type),
      ...trackList.gnomeMusic.filter(track => track && !track.type),
      ...trackList.bonusUnassigned.filter(track => track && !track.type)
    ];

    // Sort tracks: ready first, then planned
    return allTracks.sort((a, b) => {
      const statusOrder = { ready: 0, planned: 1 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };

  const handleTrackClick = (track) => {
    console.log('=== handleTrackClick ===');
    console.log('Track clicked:', track);
    console.log('Current track:', currentTrack);
    console.log('Is playing:', playerIsPlaying);
    
    if (!track.filename) {
      console.log('Track has no filename, ignoring click');
      return;
    }
    
    if (currentTrack?.id === track.id) {
      console.log('Clicked current track, toggling play state');
      onPlayStateChange(!playerIsPlaying);
    } else {
      console.log('Clicked different track, starting playback');
      onPlayTrack(track);
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

  const totalDuration = calculateTotalDuration(tracks);

  // Update the handlePlayAll function
  const handlePlayAll = () => {
    // Get only main tracks that are playable
    const playableTracks = getAllTracks()
      .filter(track => track.filename);
    
    console.log('Play All - Playable tracks:', playableTracks);
    
    if (playableTracks.length > 0) {
      onPlayTrack(playableTracks[0]);
    }
  };

  const toggleTrackExpansion = (trackId) => {
    setExpandedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const handleDownload = (e, track) => {
    e.stopPropagation(); // Prevent track click
    if (track.filename) {
      const downloadUrl = `${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(track.filename)}/download`;
      window.open(downloadUrl, '_blank');
    }
  };

  const renderTrackRow = (track, index, isSubtrack = false) => {
    const isExpanded = expandedTracks.has(track.id);
    const hasSubtracks = track.subtracks && track.subtracks.length > 0;
    const trackFile = tracks.find(t => t.filename === track.filename);
    const duration = trackFile?.duration || '--:--';
    const isCurrentTrack = currentTrack?.id === track.id;
    const isPlaying = isCurrentTrack && playerIsPlaying;
    
    return (
      <React.Fragment key={track.id}>
        <div 
          className={`track-row ${track.status} ${isCurrentTrack ? 'playing' : ''} ${!track.filename ? 'unavailable' : ''} ${isSubtrack ? 'subtrack' : ''}`}
          onClick={() => hasSubtracks ? toggleTrackExpansion(track.id) : handleTrackClick(track)}
        >
          <div className="play-button-cell">
            {track.filename && (
              <span 
                className="play-icon-wrapper"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTrackClick(track);
                }}
              >
                {isCurrentTrack ? 
                  (isPlaying ? <FaPause className="play-icon" /> : <FaPlay className="play-icon" />) : 
                  <FaPlay className="play-icon" />}
              </span>
            )}
          </div>
          <div className="track-number">
            <span className="number">{!isSubtrack && index + 1}</span>
          </div>
          <div className="track-title">
            <span className="title-text">{track.title}</span>
            <div className="track-controls">
              {track.filename && (
                <span 
                  className="download-icon-wrapper"
                  onClick={(e) => handleDownload(e, track)}
                  title="Download track"
                >
                  <FaDownload className="download-icon" />
                </span>
              )}
              <div className="badge-container">
                {track.type === 'substem' && <span className="substem-label">substem</span>}
                {track.type === 'alternative' && <span className="alternative-label">alternative</span>}
                {hasSubtracks && !isSubtrack && <span className="stems-label">stems</span>}
              </div>
              {hasSubtracks && (
                <span 
                  className="expand-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTrackExpansion(track.id);
                  }}
                >
                  {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              )}
            </div>
          </div>
          <div className="track-duration">
            {duration}
          </div>
        </div>
        {hasSubtracks && isExpanded && (
          <div className="subtracks">
            {track.subtracks.map((subtrack, subIndex) => 
              renderTrackRow(subtrack, subIndex, true)
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

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
          <button className="play-all-button" onClick={handlePlayAll}>
            <FaPlayCircle /> Play All
          </button>
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
        </div>
        
        {/* Divider for Delivery A */}
        <div className="section-divider">
          <h3>Delivery A</h3>
        </div>
        
        {/* Score section */}
        {sortTracks(trackList?.score.filter(track => track) || [], sortConfig).map((track, index) => 
          renderTrackRow(track, index)
        )}
        
        {/* Divider for Gnome Music */}
        <div className="section-divider">
          <h3>Gnome Music (demos)</h3>
        </div>
        
        {/* Gnome Music section */}
        {sortTracks(trackList?.gnomeMusic.filter(track => track) || [], sortConfig).map((track, index) => 
          renderTrackRow(track, index)
        )}
        
        {/* Divider for Bonus & Unassigned */}
        <div className="section-divider">
          <h3>Bonus & Unassigned (Delivery B)</h3>
        </div>
        
        {/* Bonus & Unassigned section */}
        {sortTracks(trackList?.bonusUnassigned.filter(track => track) || [], sortConfig).map((track, index) => 
          renderTrackRow(track, index)
        )}
      </div>
    </div>
  );
}

export default TrackList;
