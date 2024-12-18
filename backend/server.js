const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const util = require('util');
const multer = require('multer');
const mm = require('music-metadata');

// Load environment variables
dotenv.config();

// Add more logging for CORS and environment
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS Origin:', process.env.CORS_ORIGIN);
console.log('Port:', process.env.PORT);

const app = express();

// Add CORS pre-flight handling
app.options('*', cors());

// Update CORS configuration
app.use(cors({
  origin: true, // Allow all origins temporarily for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  
  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// Update the directory constants
const MEDIA_DIRECTORY = process.env.NODE_ENV === 'production' 
  ? '/app/media'  // Railway mount point
  : path.join(__dirname, 'media');

// Store trackList.json in the media directory
const TRACK_LIST_PATH = path.join(MEDIA_DIRECTORY, 'trackList.json');
const TEMPLATE_TRACK_LIST_PATH = path.join(__dirname, 'trackList.template.json');

// Add logging to help debug paths
console.log('Media directory:', MEDIA_DIRECTORY);

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIRECTORY)) {
  console.log('Creating media directory:', MEDIA_DIRECTORY);
  fs.mkdirSync(MEDIA_DIRECTORY, { recursive: true });
}

// Initialize trackList.json if it doesn't exist
if (!fs.existsSync(TRACK_LIST_PATH)) {
  console.log('Initializing track list at:', TRACK_LIST_PATH);
  if (fs.existsSync(TEMPLATE_TRACK_LIST_PATH)) {
    fs.copyFileSync(TEMPLATE_TRACK_LIST_PATH, TRACK_LIST_PATH);
  } else {
    const emptyTrackList = {
      score: [],
      gnomeMusic: [],
      outsideScope: [],
      bonusUnassigned: []
    };
    fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(emptyTrackList, null, 2));
  }
}

// Serve static files from media directory
app.use('/media', express.static(MEDIA_DIRECTORY));

// Add this helper function at the top with other helpers
const getDuration = async (filepath) => {
  try {
    const metadata = await mm.parseFile(filepath);
    const duration = metadata.format.duration;
    console.log(`Duration for ${filepath}:`, duration);
    return duration;
  } catch (error) {
    console.error(`Error getting duration for ${filepath}:`, error);
    throw error;
  }
};

// Helper function to format duration
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Move this before any other route definitions
app.use(express.json());

// Update backup directory to be in media directory
const backupTrackList = (trackList) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(MEDIA_DIRECTORY, 'backups');
  const backupPath = path.join(backupDir, `trackList-${timestamp}.json`);
  
  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Save backup
  fs.writeFileSync(backupPath, JSON.stringify(trackList, null, 2));
  
  // Clean up old backups (keep last 10)
  const backups = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('trackList-'))
    .sort()
    .reverse()
    .slice(10);
    
  backups.forEach(backup => {
    fs.unlinkSync(path.join(backupDir, backup));
  });
};

// Update all references to trackList.json to use TRACK_LIST_PATH
// For example, in your /track-list endpoint:
app.get('/track-list', (req, res) => {
  console.log('GET /track-list - Checking path:', TRACK_LIST_PATH);
  try {
    if (!fs.existsSync(TRACK_LIST_PATH)) {
      console.log('Track list file not found at:', TRACK_LIST_PATH);
      // Initialize empty track list if it doesn't exist
      const emptyTrackList = {
        score: [],
        gnomeMusic: [],
        outsideScope: [],
        bonusUnassigned: []
      };
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(emptyTrackList, null, 2));
      console.log('Created new track list file');
      return res.json(emptyTrackList);
    }
    
    const trackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    console.log('Successfully read track list');
    res.json(trackList);
  } catch (error) {
    console.error('Error reading track list:', error);
    res.status(500).json({ error: 'Failed to read track list: ' + error.message });
  }
});

// Update assign-track endpoint
app.post('/assign-track', async (req, res) => {
  try {
    const { trackId, filename } = req.body;
    
    // Create backup before modification
    const currentTrackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    backupTrackList(currentTrackList);
    
    // Update track list
    let updated = false;
    
    const updateTrack = (tracks) => {
      tracks.forEach(track => {
        if (track.id === trackId) {
          track.filename = filename;
          track.status = filename ? 'ready' : 'planned';
          updated = true;
        }
        if (track.subtracks) {
          updateTrack(track.subtracks);
        }
      });
    };

    Object.values(currentTrackList).forEach(section => {
      updateTrack(section);
    });

    if (!updated) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Save with error handling
    try {
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(currentTrackList, null, 2));
      res.json({ 
        message: 'Track updated successfully', 
        trackList: currentTrackList,
        timestamp: new Date().toISOString()
      });
    } catch (writeError) {
      // Try to restore from backup if save fails
      console.error('Error saving track list:', writeError);
      const backup = fs.readFileSync(path.join(MEDIA_DIRECTORY, 'backups', fs.readdirSync(path.join(MEDIA_DIRECTORY, 'backups')).pop()));
      fs.writeFileSync(TRACK_LIST_PATH, backup);
      throw new Error('Failed to save changes, restored from backup');
    }
  } catch (error) {
    console.error('Error in assign-track:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get the list of tracks
app.get('/tracks', (req, res) => {
  console.log('GET /tracks - Checking directory:', MEDIA_DIRECTORY);
  try {
    if (!fs.existsSync(MEDIA_DIRECTORY)) {
      console.log('Media directory not found, creating it');
      fs.mkdirSync(MEDIA_DIRECTORY, { recursive: true });
    }

    const files = fs.readdirSync(MEDIA_DIRECTORY);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    console.log('Found MP3 files:', mp3Files);

    const tracks = mp3Files.map(filename => ({
      id: filename,
      filename,
      name: filename.replace('.mp3', ''),
      duration: '0:00' // We'll add actual duration later
    }));

    console.log('Returning tracks:', tracks);
    res.json(tracks);
  } catch (error) {
    console.error('Error in /tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to stream a specific track
app.get('/tracks/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(MEDIA_DIRECTORY, filename);

  console.log('Track request:', {
    filename,
    filepath,
    exists: fs.existsSync(filepath),
    mediaDirectory: MEDIA_DIRECTORY
  });

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    console.log('Track not found:', filepath);
    return res.status(404).json({ error: 'Track not found' });
  }
  const stat = fs.statSync(filepath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range request for seeking
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg'
    });
    fs.createReadStream(filepath, { start, end }).pipe(res);
  } else {
    // Stream the entire file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg'
    });
    fs.createReadStream(filepath).pipe(res);
  }
});

// Add a new endpoint to get album info
app.get('/album-info', (req, res) => {
  console.log('GET /album-info - Checking directory:', MEDIA_DIRECTORY);
  try {
    if (!fs.existsSync(MEDIA_DIRECTORY)) {
      console.log('Media directory not found, creating it');
      fs.mkdirSync(MEDIA_DIRECTORY, { recursive: true });
    }

    const files = fs.readdirSync(MEDIA_DIRECTORY);
    const imageFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
    console.log('Found image files:', imageFiles);

    res.json({
      coverImage: imageFiles.length > 0 ? `/media/${imageFiles[0]}` : null
    });
  } catch (error) {
    console.error('Error in /album-info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this near the top of the file, after the imports
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add error handling middleware at the bottom before app.listen
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Use PORT from environment variables
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS Origin:', process.env.CORS_ORIGIN);
  console.log('Media Directory:', MEDIA_DIRECTORY);
  console.log('Current Directory:', __dirname);
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    if (!fs.existsSync(MEDIA_DIRECTORY)) {
      fs.mkdirSync(MEDIA_DIRECTORY, { recursive: true });
    }
    cb(null, MEDIA_DIRECTORY);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Add upload endpoint
app.post('/upload', upload.array('files'), (req, res) => {
  try {
    console.log('Files received:', req.files);
    
    // Handle metadata.json separately
    const metadataFile = req.files.find(f => f.originalname === 'metadata.json');
    if (metadataFile) {
      // Save metadata.json in the media directory instead of __dirname
      const metadataPath = path.join(MEDIA_DIRECTORY, 'metadata.json');
      fs.copyFileSync(metadataFile.path, metadataPath);
      console.log('Metadata file saved to:', metadataPath);
    }

    res.json({ 
      message: 'Files uploaded successfully',
      files: req.files.map(f => f.originalname)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Add this debug endpoint near your other endpoints
app.get('/debug-media', (req, res) => {
  try {
    const files = fs.readdirSync(MEDIA_DIRECTORY);
    const stats = {
      directory: MEDIA_DIRECTORY,
      exists: fs.existsSync(MEDIA_DIRECTORY),
      files: files,
      fileDetails: files.map(file => {
        const filepath = path.join(MEDIA_DIRECTORY, file);
        return {
          name: file,
          size: fs.statSync(filepath).size,
          type: path.extname(file)
        };
      })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      mediaDirectory: MEDIA_DIRECTORY
    });
  }
});

// Add this debug endpoint
app.get('/debug', (req, res) => {
  try {
    const debug = {
      environment: process.env.NODE_ENV,
      mediaDirectory: MEDIA_DIRECTORY,
      mediaExists: fs.existsSync(MEDIA_DIRECTORY),
      mediaContents: fs.existsSync(MEDIA_DIRECTORY) ? fs.readdirSync(MEDIA_DIRECTORY) : [],
      trackListPath: TRACK_LIST_PATH,
      trackListExists: fs.existsSync(TRACK_LIST_PATH),
      trackListContents: fs.existsSync(TRACK_LIST_PATH) ? JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8')) : null,
      currentWorkingDir: process.cwd(),
      dirname: __dirname
    };
    res.json(debug);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Add these endpoints after your existing ones

// Get track list
app.get('/track-list', (req, res) => {
  console.log('GET /track-list - Checking path:', TRACK_LIST_PATH);
  try {
    if (!fs.existsSync(TRACK_LIST_PATH)) {
      console.log('Track list file not found at:', TRACK_LIST_PATH);
      // Initialize empty track list if it doesn't exist
      const emptyTrackList = {
        score: [],
        gnomeMusic: [],
        outsideScope: [],
        bonusUnassigned: []
      };
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(emptyTrackList, null, 2));
      console.log('Created new track list file');
      return res.json(emptyTrackList);
    }
    
    const trackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    console.log('Successfully read track list');
    res.json(trackList);
  } catch (error) {
    console.error('Error reading track list:', error);
    res.status(500).json({ error: 'Failed to read track list: ' + error.message });
  }
});

// Add this debug endpoint
app.get('/debug-tracklist', (req, res) => {
  try {
    const trackListPath = path.join(__dirname, 'trackList.json');
    const debug = {
      path: trackListPath,
      exists: fs.existsSync(trackListPath),
      contents: fs.existsSync(trackListPath) 
        ? JSON.parse(fs.readFileSync(trackListPath, 'utf8'))
        : null
    };
    res.json(debug);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Add this near the top of the file, after the imports
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add this endpoint for downloads
app.get('/tracks/:filename/download', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(MEDIA_DIRECTORY, filename);

  console.log('Download request:', {
    filename,
    filepath,
    exists: fs.existsSync(filepath)
  });

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    console.log('Track not found:', filepath);
    return res.status(404).json({ error: 'Track not found' });
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'audio/mpeg');
  
  // Stream the file
  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);
});

// Add delete endpoint
app.delete('/tracks/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(MEDIA_DIRECTORY, filename);

  console.log('Delete request:', {
    filename,
    filepath,
    exists: fs.existsSync(filepath)
  });

  try {
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is in use by any track
    const trackListPath = path.join(__dirname, 'trackList.json');
    const trackList = JSON.parse(fs.readFileSync(trackListPath, 'utf8'));
    
    const isFileInUse = Object.values(trackList).some(section =>
      section.some(track => {
        if (track.filename === filename) return true;
        if (track.subtracks) {
          return track.subtracks.some(subtrack => subtrack.filename === filename);
        }
        return false;
      })
    );

    if (isFileInUse) {
      return res.status(400).json({ 
        error: 'File is currently assigned to a track. Unassign it first.' 
      });
    }

    // Delete the file
    fs.unlinkSync(filepath);
    console.log('File deleted successfully:', filename);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// Add these new endpoints after your existing ones

// Update track list
app.post('/track-list/update', async (req, res) => {
  try {
    const { section, trackId, updates } = req.body;
    console.log('Updating track:', { section, trackId, updates });
    
    // Create backup before modification
    const currentTrackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    backupTrackList(currentTrackList);

    // Helper function to find and update track
    const updateTrackInSection = (tracks) => {
      return tracks.map(track => {
        if (track.id === trackId) {
          return { ...track, ...updates };
        }
        if (track.subtracks) {
          return {
            ...track,
            subtracks: updateTrackInSection(track.subtracks)
          };
        }
        return track;
      });
    };

    if (section in currentTrackList) {
      currentTrackList[section] = updateTrackInSection(currentTrackList[section]);
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(currentTrackList, null, 2));
      res.json({ message: 'Track updated successfully', trackList: currentTrackList });
    } else {
      res.status(400).json({ error: 'Invalid section' });
    }
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ error: 'Failed to update track: ' + error.message });
  }
});

// Add new track or subtrack
app.post('/track-list/add', async (req, res) => {
  try {
    const { section, parentTrackId, newTrack } = req.body;
    console.log('Adding track:', { section, parentTrackId, newTrack });
    
    // Create backup before modification
    const currentTrackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    backupTrackList(currentTrackList);

    // Helper function to add subtrack to parent
    const addSubtrackToParent = (tracks) => {
      return tracks.map(track => {
        if (track.id === parentTrackId) {
          return {
            ...track,
            subtracks: [...(track.subtracks || []), newTrack]
          };
        }
        if (track.subtracks) {
          return {
            ...track,
            subtracks: addSubtrackToParent(track.subtracks)
          };
        }
        return track;
      });
    };

    if (parentTrackId) {
      // Adding a subtrack
      currentTrackList[section] = addSubtrackToParent(currentTrackList[section]);
    } else {
      // Adding a main track
      if (!currentTrackList[section]) {
        currentTrackList[section] = [];
      }
      currentTrackList[section].push(newTrack);
    }

    fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(currentTrackList, null, 2));
    res.json({ message: 'Track added successfully', trackList: currentTrackList });
  } catch (error) {
    console.error('Error adding track:', error);
    res.status(500).json({ error: 'Failed to add track: ' + error.message });
  }
});

// Delete track or subtrack
app.delete('/track-list/:section/:trackId', async (req, res) => {
  try {
    const { section, trackId } = req.params;
    console.log('Deleting track:', { section, trackId });
    
    // Create backup before modification
    const currentTrackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    backupTrackList(currentTrackList);

    // Helper function to remove track
    const removeTrack = (tracks) => {
      return tracks.filter(track => {
        if (track.id === trackId) {
          console.log('Found track to remove:', track);
          return false;
        }
        if (track.subtracks) {
          track.subtracks = removeTrack(track.subtracks);
        }
        return true;
      });
    };

    if (section in currentTrackList) {
      currentTrackList[section] = removeTrack(currentTrackList[section]);
      
      // Save the updated track list
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(currentTrackList, null, 2));
      console.log('Track list updated after deletion');
      
      res.json({ 
        message: 'Track deleted successfully', 
        trackList: currentTrackList 
      });
    } else {
      res.status(400).json({ error: 'Invalid section' });
    }
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ 
      error: 'Failed to delete track: ' + error.message,
      details: {
        section: req.params.section,
        trackId: req.params.trackId,
        path: TRACK_LIST_PATH
      }
    });
  }
});

// Update reorder endpoint
app.post('/track-list/reorder', async (req, res) => {
  try {
    const {
      trackId,
      sourceSection,
      sourceParentId,
      destinationSection,
      destinationParentId,
      sourceIndex,
      destinationIndex
    } = req.body;

    console.log('Reorder request:', {
      trackId,
      sourceSection,
      sourceParentId,
      destinationSection,
      destinationParentId,
      sourceIndex,
      destinationIndex
    });

    const trackListPath = path.join(__dirname, 'trackList.json');
    const trackList = JSON.parse(fs.readFileSync(trackListPath, 'utf8'));

    // Helper function to find and remove track
    const findAndRemoveTrack = (tracks, id) => {
      let removedTrack = null;
      const newTracks = tracks.filter(track => {
        if (track?.id === id) {
          removedTrack = track;
          return false;
        }
        if (track?.subtracks) {
          const [newSubtracks, found] = findAndRemoveTrack(track.subtracks, id);
          if (found) {
            removedTrack = found;
            track.subtracks = newSubtracks;
          }
        }
        return true;
      });
      return [newTracks.filter(t => t !== null), removedTrack];
    };

    // Helper function to find parent track
    const findParentTrack = (tracks, parentId) => {
      for (const track of tracks) {
        if (track?.id === parentId) {
          return track;
        }
        if (track?.subtracks) {
          const found = findParentTrack(track.subtracks, parentId);
          if (found) return found;
        }
      }
      return null;
    };

    // Remove track from source
    let trackToMove;
    if (sourceParentId) {
      const sourceParent = findParentTrack(trackList[sourceSection], sourceParentId);
      if (sourceParent) {
        trackToMove = sourceParent.subtracks[sourceIndex];
        sourceParent.subtracks.splice(sourceIndex, 1);
      }
    } else {
      trackToMove = trackList[sourceSection][sourceIndex];
      trackList[sourceSection].splice(sourceIndex, 1);
    }

    // Insert track at destination
    if (destinationParentId) {
      const destParent = findParentTrack(trackList[destinationSection], destinationParentId);
      if (destParent) {
        destParent.subtracks = destParent.subtracks || [];
        destParent.subtracks.splice(destinationIndex, 0, trackToMove);
      }
    } else {
      trackList[destinationSection].splice(destinationIndex, 0, trackToMove);
    }

    // Clean up any null entries
    Object.keys(trackList).forEach(section => {
      trackList[section] = trackList[section].filter(track => track !== null);
    });

    fs.writeFileSync(trackListPath, JSON.stringify(trackList, null, 2));
    res.json({ message: 'Track reordered successfully', trackList });
  } catch (error) {
    console.error('Error reordering track:', error);
    res.status(500).json({ error: 'Failed to reorder track: ' + error.message });
  }
});

// Update move endpoint
app.post('/track-list/move', async (req, res) => {
  try {
    const { trackId, section, direction, parentId } = req.body;
    console.log('Moving track:', { trackId, section, direction, parentId });
    
    // Create backup before modification
    const currentTrackList = JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8'));
    backupTrackList(currentTrackList);

    const moveInArray = (array, trackId, direction) => {
      const index = array.findIndex(track => track.id === trackId);
      if (index === -1) return false;

      if (direction === 'up' && index > 0) {
        [array[index - 1], array[index]] = [array[index], array[index - 1]];
        return true;
      } else if (direction === 'down' && index < array.length - 1) {
        [array[index], array[index + 1]] = [array[index + 1], array[index]];
        return true;
      }
      return false;
    };

    let moved = false;
    if (parentId) {
      // Move within subtracks
      const findAndMove = (tracks) => {
        tracks.forEach(track => {
          if (track.id === parentId && track.subtracks) {
            moved = moveInArray(track.subtracks, trackId, direction);
          } else if (track.subtracks) {
            findAndMove(track.subtracks);
          }
        });
      };
      findAndMove(currentTrackList[section]);
    } else {
      // Move main track
      moved = moveInArray(currentTrackList[section], trackId, direction);
    }

    if (moved) {
      fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(currentTrackList, null, 2));
      res.json({ message: 'Track moved successfully', trackList: currentTrackList });
    } else {
      res.status(400).json({ error: 'Could not move track' });
    }
  } catch (error) {
    console.error('Error moving track:', error);
    res.status(500).json({ error: 'Failed to move track: ' + error.message });
  }
});

// Save track list
app.post('/track-list/save', async (req, res) => {
  try {
    const { trackList } = req.body;
    console.log('Saving track list');
    
    // Create backup before saving
    if (fs.existsSync(TRACK_LIST_PATH)) {
      backupTrackList(JSON.parse(fs.readFileSync(TRACK_LIST_PATH, 'utf8')));
    }

    // Save new track list
    fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(trackList, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Track list saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving track list:', error);
    res.status(500).json({ error: 'Failed to save track list: ' + error.message });
  }
});

// Get stem mixes
app.get('/stem-mixes/:trackId', (req, res) => {
  try {
    const mixesPath = path.join(MEDIA_DIRECTORY, 'stemMixes.json');
    if (!fs.existsSync(mixesPath)) {
      fs.writeFileSync(mixesPath, JSON.stringify({ mixes: {} }, null, 2));
    }
    
    const mixes = JSON.parse(fs.readFileSync(mixesPath, 'utf8'));
    res.json(mixes.mixes[req.params.trackId] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load mixes' });
  }
});

// Save stem mix
app.post('/stem-mixes/:trackId', (req, res) => {
  try {
    const { name, stems } = req.body;
    const mixesPath = path.join(MEDIA_DIRECTORY, 'stemMixes.json');
    
    let mixes = { mixes: {} };
    if (fs.existsSync(mixesPath)) {
      mixes = JSON.parse(fs.readFileSync(mixesPath, 'utf8'));
    }
    
    if (!mixes.mixes[req.params.trackId]) {
      mixes.mixes[req.params.trackId] = [];
    }
    
    mixes.mixes[req.params.trackId].push({ name, stems });
    fs.writeFileSync(mixesPath, JSON.stringify(mixes, null, 2));
    
    res.json({ message: 'Mix saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save mix' });
  }
});

// Update the migration endpoint with more logging
app.post('/migrate-track-ids', async (req, res) => {
  try {
    console.log('Migration endpoint hit');
    console.log('Headers:', req.headers);
    console.log('Migration key from env:', process.env.MIGRATION_KEY);

    // Check for migration secret key
    if (req.headers['x-migration-key'] !== process.env.MIGRATION_KEY) {
      console.log('Unauthorized attempt - key mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Starting migration...');
    const trackListPath = path.join(MEDIA_DIRECTORY, 'trackList.json');
    console.log('Track list path:', trackListPath);
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(MEDIA_DIRECTORY, 'backups');
    const backupPath = path.join(backupDir, `trackList-pre-migration-${timestamp}.json`);
    
    console.log('Creating backup directory:', backupDir);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Read current track list
    console.log('Reading track list...');
    const data = fs.readFileSync(trackListPath, 'utf8');
    const trackList = JSON.parse(data);
    
    // Create backup
    console.log('Creating backup at:', backupPath);
    fs.writeFileSync(backupPath, data);
    
    // Migration logic
    console.log('Starting ID updates...');
    const updateTrackIds = (tracks, parentId = null) => {
      return tracks.map(track => {
        if (!track) return null;

        const baseId = track.title.toLowerCase().replace(/\s+/g, '-');
        const newId = parentId ? `${parentId}-${baseId}` : baseId;
        const oldId = track.id;
        
        console.log(`Updating track ID: ${oldId} -> ${newId}`);
        
        const updatedTrack = {
          ...track,
          id: newId
        };

        if (updatedTrack.subtracks) {
          updatedTrack.subtracks = updateTrackIds(updatedTrack.subtracks, newId);
        }

        return updatedTrack;
      });
    };

    // Update each section
    ['score', 'gnomeMusic', 'outsideScope', 'bonusUnassigned'].forEach(section => {
      console.log(`Processing section: ${section}`);
      if (trackList[section]) {
        trackList[section] = updateTrackIds(trackList[section]);
      }
    });

    // Save updated track list
    console.log('Saving updated track list...');
    fs.writeFileSync(trackListPath, JSON.stringify(trackList, null, 2));
    
    console.log('Migration completed successfully');
    res.json({ 
      success: true, 
      message: 'Migration completed successfully',
      backupPath
    });

  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mediaDirectory: MEDIA_DIRECTORY,
    trackListExists: fs.existsSync(TRACK_LIST_PATH),
    mediaDirectoryExists: fs.existsSync(MEDIA_DIRECTORY)
  });
});
