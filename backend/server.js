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

// Update CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3006',  // Add this line
      'http://192.168.1.37:3000',
      'https://frontend-production-8b85.up.railway.app',
      'https://frontend-production-b5db.up.railway.app'
    ];
    
    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Directory where all media files are stored
const mediaDirectory = process.env.NODE_ENV === 'production' 
  ? '/app/media'  // Railway mount point
  : path.join(__dirname, 'media');

// Add logging to help debug paths
console.log('Media directory:', mediaDirectory);

// Serve static files from media directory
app.use('/media', express.static(mediaDirectory));

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

// Add the assign-track endpoint near the top with other main routes
app.post('/assign-track', async (req, res) => {
  try {
    console.log('Received assign track request:', req.body);
    const { trackId, filename } = req.body;
    const trackListPath = path.join(__dirname, 'trackList.json');
    
    console.log('Reading track list from:', trackListPath);
    const trackList = JSON.parse(fs.readFileSync(trackListPath, 'utf8'));

    // Find and update the track (including subtracks)
    let updated = false;
    
    const updateTrack = (tracks) => {
      tracks.forEach(track => {
        if (track.id === trackId) {
          console.log(`Updating track ${trackId}:`, {
            before: track,
            after: { ...track, filename, status: filename ? 'ready' : 'planned' }
          });
          track.filename = filename;
          track.status = filename ? 'ready' : 'planned';
          updated = true;
        }
        // Check subtracks if they exist
        if (track.subtracks) {
          updateTrack(track.subtracks);
        }
      });
    };

    // Update tracks in all sections
    Object.values(trackList).forEach(section => {
      updateTrack(section);
    });

    if (!updated) {
      console.log('Track not found:', trackId);
      return res.status(404).json({ error: 'Track not found' });
    }

    // Save the updated track list
    fs.writeFileSync(trackListPath, JSON.stringify(trackList, null, 2));
    console.log('Track list updated successfully');
    res.json({ message: 'Track updated successfully', trackList });
  } catch (error) {
    console.error('Error assigning track:', error);
    res.status(500).json({ error: 'Failed to assign track: ' + error.message });
  }
});

// Endpoint to get the list of tracks
app.get('/tracks', async (req, res) => {
  try {
    console.log('\n=== Tracks Request ===');
    console.log('Media directory:', mediaDirectory);
    
    const allFiles = fs.readdirSync(mediaDirectory);
    const mp3Files = allFiles.filter(file => file.toLowerCase().endsWith('.mp3'));
    
    const tracks = await Promise.all(mp3Files.map(async filename => {
      try {
        const filepath = path.join(mediaDirectory, filename);
        console.log('Processing:', filepath);
        
        // Get metadata including duration
        const metadata = await mm.parseFile(filepath);
        const duration = Math.round(metadata.format.duration || 0);
        
        // Format duration properly
        const minutes = Math.floor(duration / 60);
        const seconds = Math.round(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        console.log(`Duration for ${filename}:`, formattedDuration);

        return {
          id: filename,
          filename,
          name: filename.replace('.mp3', ''),
          rawDuration: duration,
          duration: formattedDuration
        };
      } catch (err) {
        console.error('Error processing track:', filename, err);
        return {
          id: filename,
          filename,
          name: filename.replace('.mp3', ''),
          rawDuration: 0,
          duration: '--:--'
        };
      }
    }));

    console.log('Final tracks:', tracks);
    res.json(tracks);
  } catch (error) {
    console.error('Error in /tracks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to stream a specific track
app.get('/tracks/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(mediaDirectory, filename);

  console.log('Track request:', {
    filename,
    filepath,
    exists: fs.existsSync(filepath),
    mediaDirectory
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
  try {
    // Get the first image file from the media directory
    const imageFiles = fs.readdirSync(mediaDirectory)
      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
    
    const albumCover = imageFiles.length > 0 ? imageFiles[0] : null;
    
    res.json({
      coverImage: albumCover ? `/media/${albumCover}` : null
    });
  } catch (error) {
    console.error('Error reading album info:', error);
    res.status(500).json({ error: 'Failed to read album info' });
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
  console.log('Media Directory:', mediaDirectory);
  console.log('Current Directory:', __dirname);
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    if (!fs.existsSync(mediaDirectory)) {
      fs.mkdirSync(mediaDirectory, { recursive: true });
    }
    cb(null, mediaDirectory);
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
      const metadataPath = path.join(mediaDirectory, 'metadata.json');
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
    const files = fs.readdirSync(mediaDirectory);
    const stats = {
      directory: mediaDirectory,
      exists: fs.existsSync(mediaDirectory),
      files: files,
      fileDetails: files.map(file => {
        const filepath = path.join(mediaDirectory, file);
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
      mediaDirectory
    });
  }
});

// Add this debug endpoint
app.get('/debug', (req, res) => {
  try {
    const debug = {
      environment: process.env.NODE_ENV,
      mediaDirectory,
      mediaExists: fs.existsSync(mediaDirectory),
      mediaContents: fs.existsSync(mediaDirectory) ? fs.readdirSync(mediaDirectory) : [],
      corsOrigin: process.env.CORS_ORIGIN,
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
  try {
    const trackListPath = path.join(__dirname, 'trackList.json');
    console.log('Reading track list from:', trackListPath);
    
    if (!fs.existsSync(trackListPath)) {
      console.error('Track list file not found at:', trackListPath);
      return res.status(404).json({ error: 'Track list file not found' });
    }
    
    const trackList = JSON.parse(fs.readFileSync(trackListPath, 'utf8'));
    console.log('Track list loaded successfully');
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
  const filepath = path.join(mediaDirectory, filename);

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
  const filepath = path.join(mediaDirectory, filename);

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
