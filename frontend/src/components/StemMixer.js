import React, { useState, useEffect, useRef } from 'react';
import './StemMixer.css';
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

function StemMixer({ track, onPlayStateChange }) {
  const [activeStems, setActiveStems] = useState(new Map());
  const audioRefs = useRef(new Map());
  const [stemVolumes, setStemVolumes] = useState(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTimeRef = useRef(0);
  const fadeTimeout = useRef(null);

  // Initialize all stems with volume 0 except main track
  useEffect(() => {
    if (track?.filename) {
      const initialStems = new Map();
      const initialVolumes = new Map();
      
      // Set up main track
      initialStems.set(track.id, track);
      initialVolumes.set(track.id, 1);
      
      // Set up all substems (but muted)
      track.subtracks?.forEach(subtrack => {
        if (subtrack?.filename) {
          initialStems.set(subtrack.id, subtrack);
          initialVolumes.set(subtrack.id, 0); // Start muted
        }
      });

      setActiveStems(initialStems);
      setStemVolumes(initialVolumes);

      // Create and start all audio elements
      initialStems.forEach((stem) => {
        const audio = new Audio();
        audio.src = `${process.env.REACT_APP_API_URL}/tracks/${stem.filename}`;
        audio.loop = true;
        audio.volume = stem.id === track.id ? 1 : 0;
        audio.preload = 'auto';
        audioRefs.current.set(stem.id, audio);
      });
    }

    return () => {
      // Cleanup
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
        audio.load();
      });
      audioRefs.current.clear();
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [track]);

  const fadeVolume = (audio, start, end, duration = 200) => {
    const startTime = performance.now();
    
    return new Promise(resolve => {
      const updateVolume = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = start + (end - start) * progress;
        
        if (progress < 1) {
          requestAnimationFrame(updateVolume);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(updateVolume);
    });
  };

  const toggleStem = async (stemTrack) => {
    const newActiveStems = new Map(activeStems);
    const audio = audioRefs.current.get(stemTrack.id);
    const currentVolume = stemVolumes.get(stemTrack.id) || 0;
    
    if (currentVolume > 0) {
      // Fade out
      await fadeVolume(audio, currentVolume, 0);
      setStemVolumes(prev => new Map(prev).set(stemTrack.id, 0));
    } else {
      // Fade in
      const targetVolume = stemTrack.id === track.id ? 1 : 0.7;
      await fadeVolume(audio, 0, targetVolume);
      setStemVolumes(prev => new Map(prev).set(stemTrack.id, targetVolume));
    }

    setActiveStems(newActiveStems);
  };

  const adjustVolume = async (trackId, volume) => {
    const audio = audioRefs.current.get(trackId);
    if (audio) {
      await fadeVolume(audio, audio.volume, volume, 100);
      setStemVolumes(prev => new Map(prev).set(trackId, volume));
    }
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        // Pause all
        audioRefs.current.forEach(audio => {
          audio.pause();
        });
        setIsPlaying(false);
        onPlayStateChange(false);
      } else {
        // Start all at current volumes
        const playPromises = Array.from(audioRefs.current.values()).map(audio => {
          audio.currentTime = currentTimeRef.current;
          return audio.play();
        });
        await Promise.all(playPromises);
        setIsPlaying(true);
        onPlayStateChange(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  // Keep track of time for synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && audioRefs.current.size > 0) {
        const firstAudio = audioRefs.current.values().next().value;
        currentTimeRef.current = firstAudio.currentTime;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!track || !track.filename) return null;

  return (
    <div className="stem-mixer">
      <div className="stem-header">
        <h3>{track.title} - Stem Mixer</h3>
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayback}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      <div className="stem-controls">
        {/* Main track control */}
        <div className="stem-channel main-stem">
          <div className="stem-info">
            <button 
              className={`stem-toggle ${stemVolumes.get(track.id) > 0 ? 'active' : ''}`}
              onClick={() => toggleStem(track)}
            >
              Main Track
            </button>
          </div>
          <div className="volume-control">
            <FaVolumeUp />
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={stemVolumes.get(track.id) || 0}
              onChange={(e) => adjustVolume(track.id, parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Substems */}
        {track.subtracks?.map(subtrack => (
          subtrack?.filename && (
            <div key={subtrack.id} className="stem-channel substem">
              <div className="stem-info">
                <button 
                  className={`stem-toggle ${stemVolumes.get(subtrack.id) > 0 ? 'active' : ''}`}
                  onClick={() => toggleStem(subtrack)}
                >
                  {subtrack.title}
                </button>
                <span className={`stem-type ${subtrack.type}`}>
                  {subtrack.type}
                </span>
              </div>
              <div className="volume-control">
                <FaVolumeUp />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={stemVolumes.get(subtrack.id) || 0}
                  onChange={(e) => adjustVolume(subtrack.id, parseFloat(e.target.value))}
                />
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default StemMixer; 