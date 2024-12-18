import React, { useState, useEffect, useRef } from 'react';
import './StemMixer.css';
import { FaPlay, FaPause, FaVolumeUp, FaRedo } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function StemMixer({ track, onPlayStateChange }) {
  const [activeStems, setActiveStems] = useState(new Map());
  const audioRefs = useRef(new Map());
  const [stemVolumes, setStemVolumes] = useState(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTimeRef = useRef(0);
  const fadeTimeout = useRef(null);
  const [mixes, setMixes] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [mixName, setMixName] = useState('');
  const [loadedStems, setLoadedStems] = useState(new Map());

  // Initialize all stems with volume 0 except main track
  useEffect(() => {
    if (track?.filename) {
      console.log('Initializing stems for track:', track);
      const initialStems = new Map();
      const initialVolumes = new Map();
      const newLoadedStems = new Map();
      
      // Helper function to verify and load audio
      const loadAudioForStem = async (stem) => {
        // Skip if stem doesn't have a filename
        if (!stem?.filename) {
          console.log(`Skipping empty stem: ${stem?.title || 'Untitled'}`);
          return false;
        }

        try {
          const audioUrl = `${process.env.REACT_APP_API_URL}/tracks/${encodeURIComponent(stem.filename)}`;
          console.log(`Loading audio for ${stem.title}:`, audioUrl);
          
          // First verify the file exists
          const response = await fetch(audioUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.log(`Audio file not available for ${stem.title}`);
            return false;
          }

          const audio = new Audio();
          audio.src = audioUrl;
          audio.loop = true;
          audio.volume = stem.id === track.id ? 0.5 : 0;
          audio.preload = 'auto';

          // Wait for the audio to be loaded
          await new Promise((resolve, reject) => {
            audio.onloadeddata = () => {
              console.log(`Successfully loaded audio for ${stem.title}`);
              resolve();
            };
            audio.onerror = (e) => {
              console.error(`Error loading audio for ${stem.title}:`, e.target.error);
              reject(e);
            };
          });

          // If we get here, the audio loaded successfully
          audioRefs.current.set(stem.id, audio);
          initialStems.set(stem.id, stem);
          initialVolumes.set(stem.id, stem.id === track.id ? 0.5 : 0);
          newLoadedStems.set(stem.id, true);
          return true;
        } catch (error) {
          console.error(`Failed to load audio for ${stem.title}:`, error);
          return false;
        }
      };

      // Load main track first
      loadAudioForStem(track).then(success => {
        if (!success) {
          toast.error('Failed to load main track');
          return;
        }

        // Then load substems
        if (track.subtracks) {
          Promise.all(
            track.subtracks
              .filter(subtrack => subtrack?.filename) // Only attempt to load stems with filenames
              .map(subtrack => loadAudioForStem(subtrack))
          ).then(() => {
            // Update state with successfully loaded stems
            setActiveStems(new Map(initialStems));
            setStemVolumes(new Map(initialVolumes));
            setLoadedStems(new Map(newLoadedStems));
          });
        }
      });
    }

    // Cleanup
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
        audio.load();
      });
      audioRefs.current.clear();
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [track]);

  // Load saved mixes
  useEffect(() => {
    if (track?.id) {
      axios.get(`${process.env.REACT_APP_API_URL}/stem-mixes/${track.id}`)
        .then(response => setMixes(response.data))
        .catch(error => console.error('Failed to load mixes:', error));
    }
  }, [track]);

  const fadeVolume = (audio, start, end, duration = 200) => {
    if (!audio) {
      console.log('Cannot fade volume: audio element not found');
      return Promise.resolve();
    }

    const startTime = performance.now();
    
    return new Promise(resolve => {
      const updateVolume = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        try {
          audio.volume = start + (end - start) * progress;
        } catch (error) {
          console.error('Error updating volume:', error);
        }
        
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
    // Skip if stem is not loaded
    if (!loadedStems.get(stemTrack.id)) {
      console.log(`Cannot toggle stem ${stemTrack.title}: not loaded`);
      return;
    }

    const newActiveStems = new Map(activeStems);
    const audio = audioRefs.current.get(stemTrack.id);
    
    if (!audio) {
      console.log(`Cannot toggle stem ${stemTrack.title}: audio not found`);
      return;
    }

    const currentVolume = stemVolumes.get(stemTrack.id) || 0;
    
    try {
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
    } catch (error) {
      console.error(`Error toggling stem ${stemTrack.title}:`, error);
    }
  };

  const adjustVolume = async (trackId, volume) => {
    const audio = audioRefs.current.get(trackId);
    if (audio && loadedStems.get(trackId)) {
      try {
        await fadeVolume(audio, audio.volume, volume, 100);
        setStemVolumes(prev => new Map(prev).set(trackId, volume));
      } catch (error) {
        console.error(`Error adjusting volume for track ${trackId}:`, error);
      }
    }
  };

  const togglePlayback = async () => {
    try {
      if (!audioRefs.current.size) {
        throw new Error('No audio elements available');
      }

      // Only attempt to play successfully loaded stems
      const playableAudio = Array.from(audioRefs.current.entries())
        .filter(([id]) => loadedStems.get(id));

      if (playableAudio.length === 0) {
        toast.error('No playable audio tracks available');
        return;
      }

      if (isPlaying) {
        // Pause all
        playableAudio.forEach(([, audio]) => {
          audio.pause();
        });
        setIsPlaying(false);
        onPlayStateChange(false);
      } else {
        // Start all at current volumes
        const playPromises = playableAudio.map(([, audio]) => {
          audio.currentTime = currentTimeRef.current;
          return audio.play();
        });
        await Promise.all(playPromises);
        setIsPlaying(true);
        onPlayStateChange(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error(`Failed to control playback: ${error.message}`);
    }
  };

  const handleRestart = async () => {
    try {
      const playableAudio = Array.from(audioRefs.current.entries())
        .filter(([id]) => loadedStems.get(id));

      if (playableAudio.length === 0) {
        toast.error('No playable audio tracks available');
        return;
      }

      // Set current time to 0 for all audio elements
      playableAudio.forEach(([, audio]) => {
        audio.currentTime = 0;
      });
      currentTimeRef.current = 0;

      // If currently playing, restart playback
      if (isPlaying) {
        const playPromises = playableAudio.map(([, audio]) => audio.play());
        await Promise.all(playPromises);
      }
      toast.success('Restarted from beginning');
    } catch (error) {
      console.error('Restart error:', error);
      toast.error('Failed to restart playback');
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

  const handleSaveMix = async () => {
    if (!mixName) return;

    try {
      const stems = {};
      stemVolumes.forEach((volume, stemId) => {
        stems[stemId] = volume;
      });

      await axios.post(`${process.env.REACT_APP_API_URL}/stem-mixes/${track.id}`, {
        name: mixName,
        stems
      });

      setShowSaveDialog(false);
      setMixName('');
      toast.success('Mix saved successfully');
      
      // Refresh mixes
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/stem-mixes/${track.id}`);
      setMixes(response.data);
    } catch (error) {
      toast.error('Failed to save mix');
    }
  };

  const loadMix = async (mix) => {
    try {
      // Fade out all current stems
      const fadePromises = Array.from(stemVolumes.entries()).map(([stemId, currentVolume]) => {
        const audio = audioRefs.current.get(stemId);
        return fadeVolume(audio, currentVolume, 0);
      });
      
      await Promise.all(fadePromises);

      // Set new volumes
      const newVolumes = new Map();
      Object.entries(mix.stems).forEach(([stemId, volume]) => {
        newVolumes.set(stemId, volume);
        const audio = audioRefs.current.get(stemId);
        if (audio) {
          fadeVolume(audio, 0, volume);
        }
      });

      setStemVolumes(newVolumes);
      toast.success('Mix loaded');
    } catch (error) {
      toast.error('Failed to load mix');
    }
  };

  if (!track || !track.filename) return null;

  return (
    <div className="stem-mixer">
      <div className="stem-header">
        <h3>{track.title} - Stem Mixer</h3>
        <div className="playback-controls">
          <button 
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlayback}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button 
            className="restart-button"
            onClick={handleRestart}
            title="Restart from beginning"
          >
            <FaRedo />
          </button>
        </div>
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

      <div className="mix-controls">
        <button 
          className="save-mix-button"
          onClick={() => setShowSaveDialog(true)}
        >
          Save Mix
        </button>
        
        <div className="mix-presets">
          {mixes.map((mix, index) => (
            <button
              key={index}
              className="mix-preset-button"
              onClick={() => loadMix(mix)}
            >
              {mix.name}
            </button>
          ))}
        </div>
      </div>

      {showSaveDialog && (
        <div className="save-mix-dialog">
          <input
            type="text"
            value={mixName}
            onChange={(e) => setMixName(e.target.value)}
            placeholder="Enter mix name"
          />
          <button onClick={handleSaveMix}>Save</button>
          <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default StemMixer; 