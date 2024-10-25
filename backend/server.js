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

// Update CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.37:3000',
      'https://frontend-production-8b85.up.railway.app',
      'https://frontend-production-b5db.up.railway.app'  // Add your new frontend URL
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
    console.log('Tracks request received');
    console.log('Media directory:', mediaDirectory);
    
    // Check if directory exists and log its contents
    if (!fs.existsSync(mediaDirectory)) {
      console.error('Media directory does not exist:', mediaDirectory);
      return res.status(500).json({ error: 'Media directory not found' });
    }

    // Log all files in the directory
    const allFiles = fs.readdirSync(mediaDirectory);
    console.log('All files in directory:', allFiles);

    // Filter MP3 files
    const files = allFiles.filter(file => file.endsWith('.mp3'));
    console.log('MP3 files found:', files);
    
    // Try to read metadata.json from the media directory
    let metadata = {};
    try {
      const metadataPath = path.join(mediaDirectory, 'metadata.json');  // Changed this line
      console.log('Looking for metadata at:', metadataPath);
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      console.log('Metadata loaded:', metadata);
    } catch (err) {
      console.error('Error reading metadata:', err);
    }
    
    // Process each track
    const tracks = await Promise.all(files.map(async (filename) => {
      try {
        const filepath = path.join(mediaDirectory, filename);
        console.log('Processing file:', filepath);
        
        const trackInfo = metadata[filename] || {};
        const duration = await getAudioDurationInSeconds(filepath);
        
        const track = {
          id: filename,
          filename,
          name: trackInfo.name || filename.replace('.mp3', ''),
          description: trackInfo.description || '',
          image: trackInfo.image || 'default.jpg',
          duration: formatDuration(duration)
        };
        console.log('Track info created:', track);
        return track;
      } catch (err) {
        console.error('Error processing track:', filename, err);
        return null;
      }
    }));

    const validTracks = tracks.filter(track => track !== null);
    console.log('Sending tracks:', validTracks);
    
    res.json(validTracks);
  } catch (error) {
    console.error('Error in /tracks:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      mediaDirectory,
      exists: fs.existsSync(mediaDirectory)
    });
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
