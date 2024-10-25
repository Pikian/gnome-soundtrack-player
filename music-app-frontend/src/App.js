import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrackList from './components/TrackList';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  const handlePlay = (track) => {
    setCurrentTrack(track);
  };

  return (
    <Router>
      <div className="App">
        <div className="content">
          <Routes>
            <Route path="/" element={<TrackList onPlayTrack={handlePlay} currentTrack={currentTrack} />} />
          </Routes>
        </div>
        {currentTrack && (
          <div className="player-container">
            <div className="now-playing">
              <h3>{currentTrack.name}</h3>
            </div>
            <AudioPlayer
              src={`http://localhost:3001/tracks/${encodeURIComponent(currentTrack.filename)}`}
              autoPlay
              showSkipControls={false}
              showJumpControls={true}
              layout="stacked-reverse"
            />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
