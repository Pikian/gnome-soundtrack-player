import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import './TrackEditor.css';

function TrackEditor({ track, section, parentTrack, onUpdate, onClose }) {
  const [title, setTitle] = useState(track?.title || '');
  const [type, setType] = useState(track?.type || '');
  const [error, setError] = useState(null);
  const isNewTrack = !track;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const generateUniqueId = (baseTitle, parentTrack) => {
        // Create a unique ID by combining parent track ID and title
        const baseId = baseTitle.toLowerCase().replace(/\s+/g, '-');
        return parentTrack ? `${parentTrack.id}-${baseId}` : baseId;
      };

      const trackData = {
        id: track?.id || generateUniqueId(title, parentTrack),
        title,
        filename: null,
        status: 'planned',
        ...(type && { type })
      };

      if (parentTrack) {
        // Adding/editing a subtrack
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/track-list/add`, {
          section,
          parentTrackId: parentTrack.id,
          newTrack: trackData
        });
        onUpdate(response.data.trackList);
      } else if (isNewTrack) {
        // Adding a new main track
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/track-list/add`, {
          section,
          newTrack: trackData
        });
        onUpdate(response.data.trackList);
      } else {
        // Editing existing track
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/track-list/update`, {
          section,
          trackId: track.id,
          updates: { title, type }
        });
        onUpdate(response.data.trackList);
      }

      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save track');
    }
  };

  return (
    <div className="track-editor">
      <h3>
        {isNewTrack 
          ? (parentTrack ? `Add Subtrack to "${parentTrack.title}"` : 'Add New Track')
          : 'Edit Track'
        }
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter track title"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="type-select"
          >
            <option value="">Normal</option>
            <option value="substem">Substem</option>
            <option value="alternative">Alternative Version</option>
            <option value="audioqueue">Audio Queue</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <div className="button-group">
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            {isNewTrack ? 'Add Track' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrackEditor; 