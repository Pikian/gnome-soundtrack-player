import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AudioPlayer from 'react-h5-audio-player';
import { FaPlay, FaPause } from 'react-icons/fa';
import 'react-h5-audio-player/lib/styles.css';
import './TrackPlayer.css';

function TrackPlayer({ filename: propFilename }) {
  // Get filename either from props or URL params
  const { filename: urlFilename } = useParams();
  const filename = propFilename || urlFilename;

  // Construct the audio source URL
  const audioSrc = filename 
    ? `${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(filename)}`
    : '';

  // Updated time formatter
  const formatTime = (currentTime) => {
    if (!currentTime) return '0:00';
    
    const minutes = Math.floor(currentTime / 60);
    const remainingSeconds = Math.floor(currentTime % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  console.log('Audio source:', audioSrc); // Debug log

  return (
    <div className="track-player">
      {!propFilename && (
        <Link to="/" className="back-button">← Back to Library</Link>
      )}
      <h2>{decodeURIComponent(filename).replace('.mp3', '')}</h2>
      <AudioPlayer
        src={audioSrc}
        autoPlay
        showSkipControls={false}
        showJumpControls={true}
        showDownloadProgress={true}
        customProgressBarSection={['PROGRESS_BAR', 'CURRENT_TIME', 'DURATION']}
        customIcons={{
          play: <FaPlay />,
          pause: <FaPause />
        }}
        layout="stacked-reverse"
        onLoadedData={(e) => {
          console.log('Audio loaded, duration:', e.target.duration);
        }}
        onListen={(e) => {
          console.log('Current time:', e.target.currentTime);
        }}
        timeFormat={formatTime}
      />
    </div>
  );
}

export default TrackPlayer;
