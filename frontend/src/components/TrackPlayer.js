import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './TrackPlayer.css';

function TrackPlayer() {
  const { filename } = useParams();

  return (
    <div className="track-player">
      <Link to="/" className="back-button">← Back to Library</Link>
      <h2>{decodeURIComponent(filename).replace('.mp3', '')}</h2>
      <AudioPlayer
        // Update path to use /media
        src={`${process.env.REACT_APP_API_URL}/media/${encodeURIComponent(filename)}`}
        autoPlay
        showSkipControls={false}
        showJumpControls={true}
        showDownloadProgress={true}
        customProgressBarSection={['PROGRESS_BAR', 'CURRENT_TIME', 'DURATION']}
      />
    </div>
  );
}

export default TrackPlayer;
