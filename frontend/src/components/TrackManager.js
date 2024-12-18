import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlay, FaCheck, FaExclamation, FaChevronDown, FaChevronRight, FaUpload, FaTrash, FaPlus, FaEdit, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './TrackManager.css';
import TrackEditor from './TrackEditor';
import { toast } from 'react-hot-toast';

function TrackManager() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [expandedTracks, setExpandedTracks] = useState(new Set());
  const [uploadStatus, setUploadStatus] = useState(null);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [parentTrack, setParentTrack] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsManagerAuthenticated(true);
    }
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [trackListRes, filesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/track-list`),
        axios.get(`${process.env.REACT_APP_API_URL}/tracks`)
      ]);
      setTracks(trackListRes.data);
      setAvailableFiles(filesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
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
      const loadingToast = toast.loading('Saving changes...');
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/assign-track`, {
        trackId,
        filename: filename === 'none' ? null : filename
      });
      
      if (response.data.trackList) {
        setTracks(response.data.trackList);
        localStorage.setItem('trackListBackup', JSON.stringify(response.data.trackList));
        localStorage.setItem('lastSaveTime', new Date().toISOString());
        toast.success('Changes saved successfully', { id: loadingToast });
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Error assigning file:', error);
      toast.error('Failed to save changes. Please try again.', { duration: 5000 });
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

  const renderTrackItem = (track, section, isSubtrack = false, index, parentId = null) => {
    if (!track) return null;
    
    const isExpanded = expandedTracks.has(track.id);
    const hasSubtracks = track.subtracks && track.subtracks.length > 0;

    return (
      <React.Fragment key={track.id}>
        <div className={`track-item ${track.status} ${isSubtrack ? 'subtrack' : ''}`}>
          <div className="track-info">
            {hasSubtracks && (
              <span 
                className="expand-icon"
                onClick={() => toggleTrackExpansion(track.id)}
              >
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            )}
            {getStatusIcon(track.status)}
            <span className="track-title">
              {track.title}
              {track.type === 'substem' && (
                <span className="substem-label">substem</span>
              )}
              {track.type === 'alternative' && (
                <span className="alternative-label">alternative</span>
              )}
            </span>
          </div>
          {editMode && (
            <select 
              value={track.filename || 'none'}
              onChange={(e) => handleAssignFile(track.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="file-select"
            >
              <option value="none">-- No file --</option>
              {availableFiles.map(file => (
                <option key={file.filename} value={file.filename}>
                  {file.filename}
                </option>
              ))}
            </select>
          )}
          {!editMode && track.filename && (
            <div className="track-file">
              <FaPlay className="play-icon" />
              <span className="filename">{track.filename}</span>
            </div>
          )}
          {editMode && (
            <div className="track-controls">
              <div className="move-buttons">
                <button
                  className="move-button"
                  onClick={() => moveTrack(track.id, section, 'up', parentId)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <FaArrowUp />
                </button>
                <button
                  className="move-button"
                  onClick={() => moveTrack(track.id, section, 'down', parentId)}
                  title="Move down"
                >
                  <FaArrowDown />
                </button>
              </div>
              {!isSubtrack && (
                <button
                  className="add-subtrack-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSubtrack(track, section);
                  }}
                  title="Add subtrack"
                >
                  <FaPlus />
                </button>
              )}
              <button
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTrack(track, section);
                }}
              >
                <FaEdit />
              </button>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTrack(track, section);
                }}
                title="Delete track"
              >
                <FaTrash />
              </button>
            </div>
          )}
        </div>
        {hasSubtracks && isExpanded && (
          <div className="subtracks">
            {track.subtracks
              .filter(subtrack => subtrack !== null)
              .map((subtrack, subIndex) => 
                renderTrackItem(subtrack, section, true, subIndex, track.id)
              )}
          </div>
        )}
      </React.Fragment>
    );
  };

  const handleManagerLogin = (e) => {
    e.preventDefault();
    if (managerPassword === 'zimmer') {
      setIsManagerAuthenticated(true);
      setManagerPassword('');
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadStatus(`Uploading: ${percentCompleted}%`);
          }
        }
      );

      setUploadStatus('Upload successful!');
      fetchData();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(filename)}`);
      setUploadStatus('File deleted successfully');
      toast.success('File deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete file';
      setUploadStatus(errorMessage);
      toast.error(errorMessage);
      
      if (error.response?.status === 400) {
        fetchData();
      }
    }
  };

  const renderMediaLibrary = () => {
    return (
      <div className="media-library">
        <div className="media-library-header">
          <h3>Media Library</h3>
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
            accept=".mp3,.wav"
          />
          <label 
            htmlFor="file-upload" 
            className={`upload-button ${isUploading ? 'uploading' : ''}`}
            title="Upload audio files"
          >
            <FaUpload /> Upload Files
          </label>
        </div>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('failed') ? 'error' : 'success'}`}>
            {uploadStatus}
          </div>
        )}

        <div className="media-files">
          {availableFiles.map(file => (
            <div key={file.filename} className="media-file">
              <div className="file-info">
                <span className="filename">{file.filename}</span>
                <span className="duration">{file.duration}</span>
              </div>
              <button 
                className="delete-button"
                onClick={() => handleDeleteFile(file.filename)}
                title="Delete file"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAddTrack = (section) => {
    setEditingTrack(null);
    setEditingSection(section);
    setShowEditor(true);
  };

  const handleEditTrack = (track, section) => {
    setEditingTrack(track);
    setEditingSection(section);
    setShowEditor(true);
  };

  const handleDeleteTrack = async (track, section) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;

    try {
      const loadingToast = toast.loading('Deleting track...');
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/track-list/${section}/${track.id}`
      );
      
      if (response.data.trackList) {
        setTracks(response.data.trackList);
        toast.success('Track deleted successfully', { id: loadingToast });
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete track. Please try again.');
      setError('Failed to delete track');
    }
  };

  const handleAddSubtrack = (parentTrack, section) => {
    setEditingTrack(null);
    setEditingSection(section);
    setParentTrack(parentTrack);
    setShowEditor(true);
  };

  const moveTrack = async (trackId, section, direction, parentId = null) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/track-list/move`, {
        trackId,
        section,
        direction,
        parentId
      });
      
      if (response.data.trackList) {
        setTracks(response.data.trackList);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Move error:', error);
      setError('Failed to move track');
    }
  };

  useEffect(() => {
    let autoSaveInterval;
    
    if (editMode) {
      autoSaveInterval = setInterval(async () => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/track-list/save`, {
            tracks
          });
          
          if (response.data.success) {
            console.log('Auto-save successful');
            localStorage.setItem('trackListBackup', JSON.stringify(tracks));
            localStorage.setItem('lastSaveTime', new Date().toISOString());
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 30000);
    }
    
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [editMode, tracks]);

  useEffect(() => {
    const backupData = localStorage.getItem('trackListBackup');
    const lastSaveTime = localStorage.getItem('lastSaveTime');
    
    if (backupData && lastSaveTime) {
      const timeSinceLastSave = new Date() - new Date(lastSaveTime);
      const backupTrackList = JSON.parse(backupData);
      
      if (timeSinceLastSave < 3600000) {
        setTracks(backupTrackList);
      }
    }
  }, []);

  const renderSection = (sectionKey, title) => {
    if (!tracks || !tracks[sectionKey] || tracks[sectionKey].length === 0) {
      return null;
    }

    return (
      <div className="track-section separator">
        <h3>{title}</h3>
        {editMode && (
          <button
            className="add-track-button"
            onClick={() => handleAddTrack(sectionKey)}
          >
            <FaPlus /> Add Track
          </button>
        )}
        <div className="track-list">
          {tracks[sectionKey]?.filter(track => track !== null)
            .map((track, index) => 
              renderTrackItem(track, sectionKey, false, index)
            )}
        </div>
      </div>
    );
  };

  if (!isManagerAuthenticated && process.env.NODE_ENV !== 'development') {
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

  if (isLoading) {
    return (
      <div className="track-manager">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-manager">
        <div className="error-message">{error}</div>
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

      <div className="track-sections">
        {tracks && (
          <>
            {renderSection('deliveryA', 'Delivery A')}
            {renderSection('leashedBangers', 'Leashed Bangers')}
            {renderSection('deliveryB', 'Delivery B')}
            {renderSection('score', 'Score')}
            {renderSection('gnomeMusic', 'Gnome Music (demos)')}
            {renderSection('bonusUnassigned', 'Bonus & Unassigned (Delivery B)')}
          </>
        )}
      </div>

      {renderMediaLibrary()}

      {showEditor && (
        <div className="modal-overlay">
          <TrackEditor
            track={editingTrack}
            section={editingSection}
            parentTrack={parentTrack}
            onUpdate={(newTrackList) => setTracks(newTrackList)}
            onClose={() => {
              setShowEditor(false);
              setParentTrack(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TrackManager;








