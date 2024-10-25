import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaMusic } from 'react-icons/fa';
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

  useEffect(() => {
    // Fetch tracks
    axios.get('http://localhost:3001/tracks')
      .then(response => setTracks(response.data))
      .catch(error => console.error('Error fetching tracks:', error));

    // Fetch album info
    axios.get('http://localhost:3001/album-info')
      .then(response => {
        if (response.data.coverImage) {
          setAlbumCover(`http://localhost:3001${response.data.coverImage}`);
        }
      })
      .catch(error => console.error('Error fetching album info:', error));
  }, []);

  // Calculate total duration
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
        {/* Rest of your component... */}
      </div>
      {/* Rest of your component... */}
    </div>
  );
}

export default TrackList;
