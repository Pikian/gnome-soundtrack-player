import React, { useRef, useEffect, useCallback } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { FaPlay, FaPause, FaVolumeUp, FaStepForward, FaStepBackward } from 'react-icons/fa';
import 'react-h5-audio-player/lib/styles.css';
import './TrackPlayer.css';

function TrackPlayer({ filename, onPlayStateChange, onEnded, onNext, onPrevious, isPlaying }) {
  console.log('=== TrackPlayer Render ===');
  console.log('Filename:', filename);
  console.log('isPlaying:', isPlaying);

  const playerRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const currentFilenameRef = useRef(filename);
  const lastPlayPromiseRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const ignoreNextPlaybackEventRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    const isNewTrack = currentFilenameRef.current !== filename;
    
    isPlayingRef.current = isPlaying;
    currentFilenameRef.current = filename;

    if (isNewTrack) {
      isTransitioningRef.current = true;
      ignoreNextPlaybackEventRef.current = true;
      
      // Reset transition state after a short delay
      setTimeout(() => {
        isTransitioningRef.current = false;
        ignoreNextPlaybackEventRef.current = false;
      }, 100);
    }
  }, [isPlaying, filename]);

  const handlePlayback = useCallback(async () => {
    if (!playerRef.current || isTransitioningRef.current) return;

    const audio = playerRef.current.audio.current;
    
    try {
      if (lastPlayPromiseRef.current) {
        await lastPlayPromiseRef.current;
      }

      if (isPlaying && audio.paused) {
        lastPlayPromiseRef.current = audio.play();
        try {
          await lastPlayPromiseRef.current;
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Play error:', error);
          }
        }
        lastPlayPromiseRef.current = null;
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    } catch (error) {
      console.error('Audio control error:', error);
    }
  }, [isPlaying]);

  // Handle external play state changes
  useEffect(() => {
    if (!isTransitioningRef.current) {
      handlePlayback();
    }
  }, [handlePlayback]);

  // Construct audio source URL
  const audioSrc = filename 
    ? `${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(filename)}`
    : '';

  console.log('Audio source URL:', audioSrc);

  const handlePlay = (e) => {
    console.log('Player: handlePlay called');
    e.stopPropagation();
    if (!isTransitioningRef.current && !ignoreNextPlaybackEventRef.current) {
      onPlayStateChange(true);
    }
    ignoreNextPlaybackEventRef.current = false;
  };

  const handlePause = (e) => {
    console.log('Player: handlePause called');
    e.stopPropagation();
    if (!isTransitioningRef.current && !ignoreNextPlaybackEventRef.current) {
      onPlayStateChange(false);
    }
    ignoreNextPlaybackEventRef.current = false;
  };

  return (
    <div className="track-player" onClick={e => e.stopPropagation()}>
      <AudioPlayer
        ref={playerRef}
        src={audioSrc}
        autoPlay={isPlaying && !isTransitioningRef.current}
        showSkipControls={true}
        showJumpControls={false}
        showFilledVolume={true}
        layout="stacked-reverse"
        className="spotify-player"
        customIcons={{
          play: <FaPlay />,
          pause: <FaPause />,
          volume: <FaVolumeUp />,
          forward: <FaStepForward />,
          rewind: <FaStepBackward />,
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={(e) => {
          e.stopPropagation();
          if (!isTransitioningRef.current) {
            onPlayStateChange(false);
            if (onEnded) onEnded();
          }
        }}
        onClickNext={(e) => {
          e.stopPropagation();
          if (!isTransitioningRef.current) onNext();
        }}
        onClickPrevious={(e) => {
          e.stopPropagation();
          if (!isTransitioningRef.current) onPrevious();
        }}
      />
    </div>
  );
}

export default TrackPlayer;
