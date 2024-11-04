import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrackList from './components/TrackList';
import TrackPlayer from './components/TrackPlayer';
import Login from './components/Login';
import Error404 from './components/Error404';
import TrackManager from './components/TrackManager';
import './App.css';
import Navigation from './components/Navigation';

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [trackList, setTrackList] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Updated helper function to get all playable tracks
  const getAllPlayableTracks = () => {
    if (!trackList) return [];
    
    const getAllTracks = (tracks) => {
      return tracks.reduce((acc, track) => {
        // Include main track if it has a filename
        if (track.filename && !track.type) {
          acc.push({
            ...track,
            id: track.id,
            title: track.title,
            filename: track.filename,
            status: track.status
          });
        }
        
        // Include subtracks if they have filenames
        if (track.subtracks) {
          track.subtracks.forEach(subtrack => {
            if (subtrack.filename) {
              acc.push({
                ...subtrack,
                parentTrack: track.title
              });
            }
          });
        }
        
        return acc;
      }, []);
    };

    // Get all tracks from each section
    const allTracks = [
      ...getAllTracks(trackList.score || []),
      ...getAllTracks(trackList.gnomeMusic || []),
      ...getAllTracks(trackList.outsideScope || [])
    ];

    // If we're playing a subtrack, make sure it's included
    if (currentTrack?.type === 'substem') {
      const hasSubtrack = allTracks.some(t => t.id === currentTrack.id);
      if (!hasSubtrack) {
        allTracks.push(currentTrack);
      }
    }

    return allTracks;
  };

  const handlePlayTrack = (track) => {
    console.log('=== handlePlayTrack ===');
    console.log('Track received:', track);
    console.log('Current track:', currentTrack);
    console.log('Current isPlaying:', isPlaying);
    
    const allTracks = getAllPlayableTracks();
    console.log('All playable tracks:', allTracks);
    
    setPlaylist(allTracks);
    
    const trackIndex = allTracks.findIndex(t => t.id === track.id);
    console.log('Track index in playlist:', trackIndex);
    
    if (trackIndex !== -1) {
      setIsTransitioning(true);

      // If clicking the same track, just toggle play state
      if (currentTrack?.id === track.id) {
        setIsPlaying(!isPlaying);
        setIsTransitioning(false);
        return;
      }

      // If switching to a new track
      setIsPlaying(false);
      setTimeout(() => {
        setCurrentTrack(allTracks[trackIndex]);
        setIsPlaying(true);
        setIsTransitioning(false);
      }, 50);
    }
  };

  const handlePlayStateChange = (playing) => {
    console.log('=== handlePlayStateChange ===');
    console.log('Previous isPlaying:', isPlaying);
    console.log('New isPlaying:', playing);
    console.log('Current track:', currentTrack);
    
    if (!isTransitioning) {
      setIsPlaying(playing);
    }
  };

  const handleTrackEnd = () => {
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      if (currentIndex < playlist.length - 1) {
        // Play next track
        setIsTransitioning(true);
        setIsPlaying(false);
        
        setTimeout(() => {
          setCurrentTrack(playlist[currentIndex + 1]);
          setIsPlaying(true);
          setIsTransitioning(false);
        }, 50);
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
        setIsTransitioning(true);
        setIsPlaying(false);
        
        setTimeout(() => {
          setCurrentTrack(playlist[currentIndex + 1]);
          setIsPlaying(true);
          setIsTransitioning(false);
        }, 50);
      }
    }
  };

  const handlePreviousTrack = () => {
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        setIsTransitioning(true);
        setIsPlaying(false);
        
        setTimeout(() => {
          setCurrentTrack(playlist[currentIndex - 1]);
          setIsPlaying(true);
          setIsTransitioning(false);
        }, 50);
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
                  onPlayStateChange={handlePlayStateChange}
                  isTransitioning={isTransitioning}
                />
              } 
            />
            <Route path="/manage" element={<TrackManager />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
          <div className="copyright">
            © {new Date().getFullYear()} Trollheim Studios AB. All rights reserved.
          </div>
        </div>
        {currentTrack && (
          <div className="fixed-player">
            <div className="track-info">
              <h3>
                {currentTrack.title}
                {currentTrack.parentTrack && (
                  <span className="parent-track"> (from {currentTrack.parentTrack})</span>
                )}
              </h3>
              <span className="filename">{currentTrack.filename}</span>
            </div>
            <TrackPlayer 
              filename={currentTrack.filename}
              onPlayStateChange={handlePlayStateChange}
              onEnded={handleTrackEnd}
              onNext={handleNextTrack}
              onPrevious={handlePreviousTrack}
              isPlaying={isPlaying}
              isTransitioning={isTransitioning}
              key={currentTrack.filename}
            />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
