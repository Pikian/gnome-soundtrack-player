import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';
import 'react-h5-audio-player/lib/styles.css';
import './TrackPlayer.css';

function TrackPlayer({ filename, onPlayStateChange, onEnded }) {
  // Construct audio source URL
  const audioSrc = filename 
    ? `${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(filename)}`
    : '';

  return (
    <div className="track-player">
      <AudioPlayer
        src={audioSrc}
        autoPlay
        showSkipControls={false}
        showJumpControls={false}
        showFilledVolume={true}
        layout="stacked-reverse"
        className="spotify-player"
        customIcons={{
          play: <FaPlay />,
          pause: <FaPause />,
          volume: <FaVolumeUp />
        }}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
        onEnded={() => {
          onPlayStateChange(false);
          if (onEnded) onEnded();
        }}
      />
    </div>
  );
}

export default TrackPlayer;
