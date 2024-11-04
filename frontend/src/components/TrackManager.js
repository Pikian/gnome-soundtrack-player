import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlay, FaCheck, FaClock, FaExclamation, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './TrackManager.css';

function TrackManager() {
  const [trackList, setTrackList] = useState(null);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [expandedTracks, setExpandedTracks] = useState(new Set());

  const fetchData = async () => {
    try {
      const [trackListRes, filesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/track-list`),
        axios.get(`${process.env.REACT_APP_API_URL}/tracks`)
      ]);
      setTrackList(trackListRes.data);
      setAvailableFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    if (isManagerAuthenticated) {
      fetchData();
    }
  }, [isManagerAuthenticated]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <FaCheck className="status-icon ready" />;
      case 'planned':
        return <FaExclamation className="status-icon planned" />;
      default:
        return null;
    }
  };

  const handleAssignFile = async (trackId, filename) => {
    try {
      setError(null);
      console.log('Assigning file:', { trackId, filename });
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/assign-track`, {
        trackId,
        filename: filename === 'none' ? null : filename
      });
      
      console.log('Assignment response:', response.data);
      await fetchData();
      
      if (filename === 'none') {
        setSelectedTrack(null);
      }
    } catch (error) {
      console.error('Error assigning file:', error);
      setError(error.response?.data?.error || 'Failed to assign file');
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

  const renderTrackItem = (track, isSubtrack = false) => {
    const isExpanded = expandedTracks.has(track.id);
    const hasSubtracks = track.subtracks && track.subtracks.length > 0;
    const isSelected = selectedTrack?.id === track.id;

    return (
      <React.Fragment key={track.id}>
        <div 
          className={`track-item ${track.status} ${isSelected ? 'selected' : ''} ${isSubtrack ? 'subtrack' : ''}`}
          onClick={() => setSelectedTrack(track)}
        >
          <div className="track-info">
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
            {getStatusIcon(track.status)}
            <span className="track-title">
              {track.title}
              {track.type === 'substem' && <span className="substem-label">substem</span>}
            </span>
          </div>
          {track.filename && (
            <div className="track-file">
              <FaPlay className="play-icon" />
              <span className="filename">{track.filename}</span>
            </div>
          )}
        </div>
        {hasSubtracks && isExpanded && (
          <div className="subtracks">
            {track.subtracks.map(subtrack => 
              renderTrackItem(subtrack, true)
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  const handleManagerLogin = (e) => {
    e.preventDefault();
    if (managerPassword === 'bark') {
      setIsManagerAuthenticated(true);
      setManagerPassword('');
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  if (!isManagerAuthenticated) {
    return (
      <div className="track-manager-login">
        <div className="login-box">
          <h2>Track Manager Access</h2>
          <form onSubmit={handleManagerLogin}>
            <input
              type="password"
              value={managerPassword}
              onChange={(e) => setManagerPassword(e.target.value)}
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

  return (
    <div className="track-manager">
      <div className="track-manager-header">
        <h2>Track Manager</h2>
        <button 
          className="edit-button"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="track-sections">
        {trackList && (
          <>
            <div className="track-section">
              <h3>Score</h3>
              <div className="track-list">
                {trackList.score.map(track => renderTrackItem(track))}
              </div>
            </div>

            <div className="track-section separator">
              <h3>Gnome Music</h3>
              <div className="track-list">
                {trackList.gnomeMusic.map(track => renderTrackItem(track))}
              </div>
            </div>

            <div className="track-section separator">
              <h3>Outside Current Scope</h3>
              <div className="track-list">
                {trackList.outsideScope.map(track => renderTrackItem(track))}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedTrack && editMode && (
        <div className="file-assignment">
          <h3>Assign File to "{selectedTrack.title}"</h3>
          <select 
            value={selectedTrack.filename || 'none'}
            onChange={(e) => handleAssignFile(selectedTrack.id, e.target.value)}
          >
            <option value="none">-- No file assigned --</option>
            {availableFiles.map(file => (
              <option key={file.filename} value={file.filename}>
                {file.filename}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default TrackManager;








