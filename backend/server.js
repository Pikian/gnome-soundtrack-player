const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const util = require('util');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Add more logging for CORS and environment
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS Origin:', process.env.CORS_ORIGIN);
console.log('Port:', process.env.PORT);

const app = express();

// Update CORS configuration with more permissive settings for development
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.37:3000',
      'https://frontend-production-8b85.up.railway.app'  // Production URL preserved
    ];
    
    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Directory where all media files are stored
const mediaDirectory = process.env.NODE_ENV === 'production' 
  ? '/app/media'  // Single mount point in production
  : path.join(__dirname, 'media');

// Add logging to help debug paths
console.log('Media directory:', mediaDirectory);

// Serve static files from media directory
app.use('/media', express.static(mediaDirectory));

// Helper function to format duration
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Endpoint to get the list of tracks
app.get('/tracks', async (req, res) => {
  try {
    console.log('Received request for /tracks');
    // Check if directory exists
    if (!fs.existsSync(mediaDirectory)) {
      console.error('Media directory does not exist:', mediaDirectory);
      return res.status(500).json({ error: 'Media directory not found' });
    }
    const files = fs.readdirSync(mediaDirectory)
      .filter(file => file.endsWith('.mp3'));
    
    const tracks = await Promise.all(files.map(async (filename) => {
      try {
        const filepath = path.join(mediaDirectory, filename);
        let metadata = {};
        
        // Try to read metadata file
        try {
          metadata = JSON.parse(fs.readFileSync(path.join(__dirname, 'metadata.json'), 'utf-8'));
        } catch (err) {
          console.warn('Could not read metadata.json:', err.message);
          metadata = {};
        }
        
        const trackInfo = metadata[filename] || {};
        
        // Get audio duration
        const duration = await getAudioDurationInSeconds(filepath);
        
        return {
          id: filename,
          filename,
          name: trackInfo.name || filename.replace('.mp3', ''),
          description: trackInfo.description || '',
          image: trackInfo.image || 'default.jpg',
          duration: formatDuration(duration)
        };
      } catch (err) {
        console.error('Error processing track:', filename, err);
        return null;
      }
    }));

    // Filter out any null entries from errors
    const validTracks = tracks.filter(track => track !== null);
    
    res.json(validTracks);
  } catch (error) {
    console.error('Detailed error in /tracks:', util.inspect(error, { depth: null }));
    res.status(500).json({ error: 'Failed to read tracks: ' + error.message, stack: error.stack });
  }
});

// Endpoint to stream a specific track
app.get('/tracks/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(mediaDirectory, filename);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
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
      const metadataPath = path.join(__dirname, 'metadata.json');
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
