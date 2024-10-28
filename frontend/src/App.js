import React, { useState, useEffect } from 'react';
import axios from 'axios';































































































































































































































































import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';































































































































































































































































import TrackList from './components/TrackList';































































































































































































































































import TrackPlayer from './components/TrackPlayer';































































































































































































































































import Login from './components/Login';































































































































































































































































import Error404 from './components/Error404'; // Add this import































































































































































































































































import TrackManager from './components/TrackManager'; // Add this import

import './App.css';































































































































































































































































































































































































































































import Navigation from './components/Navigation'; // Add this import

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [trackList, setTrackList] = useState(null);

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

  // Helper function to get all playable tracks
  const getAllPlayableTracks = () => {
    if (!trackList) return [];
    return [
      ...(trackList.score || []),
      ...(trackList.gnomeMusic || []),
      ...(trackList.outsideScope || [])
    ].filter(track => track.filename);
  };

  const handlePlayTrack = (track) => {
    // Get all playable tracks
    const allTracks = getAllPlayableTracks();
    setPlaylist(allTracks);
    
    // Find the index of the selected track
    const trackIndex = allTracks.findIndex(t => t.id === track.id);
    if (trackIndex !== -1) {
      setCurrentTrack(allTracks[trackIndex]);
      setIsPlaying(true);
    }
  };

  const handleTrackEnd = () => {
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      if (currentIndex < playlist.length - 1) {
        // Play next track
        setCurrentTrack(playlist[currentIndex + 1]);
        setIsPlaying(true);
      } else {
        // End of playlist
        setIsPlaying(false);
      }
    }
  };

  const handleNextTrack = () => {
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      if (currentIndex < playlist.length - 1) {
        setCurrentTrack(playlist[currentIndex + 1]);
        setIsPlaying(true);
      }
    }
  };

  const handlePreviousTrack = () => {
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        setCurrentTrack(playlist[currentIndex - 1]);
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="content">
          <Routes>
            <Route 
              path="/" 
              element={
                <TrackList 
                  onPlayTrack={handlePlayTrack} 
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  trackListData={trackList}
                />
              } 
            />
            <Route path="/manage" element={<TrackManager />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </div>
        {currentTrack && (
          <div className="fixed-player">
            <div className="track-info">
              <h3>{currentTrack.title || currentTrack.name}</h3>
              <span className="filename">{currentTrack.filename}</span>
            </div>
            <TrackPlayer 
              filename={currentTrack.filename}
              onPlayStateChange={setIsPlaying}
              onEnded={handleTrackEnd}
              onNext={handleNextTrack}
              onPrevious={handlePreviousTrack}
              key={currentTrack.filename}
            />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
