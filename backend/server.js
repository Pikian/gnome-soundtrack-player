const express = require('express');















const cors = require('cors');















const fs = require('fs');















const path = require('path');















const { getAudioDurationInSeconds } = require('get-audio-duration');































const app = express();















// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-railway-url.up.railway.app']  // You'll get this URL after frontend deploys
    : 'http://localhost:3000'
}));































// Directory where MP3 files and images are stored















const musicDirectory = path.join(__dirname, 'music');















const imagesDirectory = path.join(__dirname, 'images');















// Serve static files from both directories















app.use('/images', express.static(imagesDirectory));































// Helper function to format duration















const formatDuration = (seconds) => {















  const minutes = Math.floor(seconds / 60);















  const remainingSeconds = Math.floor(seconds % 60);















  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;















};































// Endpoint to get the list of tracks















app.get('/tracks', async (req, res) => {















  try {















    const files = fs.readdirSync(musicDirectory)















      .filter(file => file.endsWith('.mp3'));















    















    const tracks = await Promise.all(files.map(async (filename) => {















      const filepath = path.join(musicDirectory, filename);















      const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, 'metadata.json'), 'utf-8'));















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















    }));















    















    res.json(tracks);















  } catch (error) {















    console.error('Error reading tracks:', error);















    res.status(500).json({ error: 'Failed to read tracks' });















  }















});































// Endpoint to stream a specific track















app.get('/tracks/:filename', (req, res) => {















  const filename = req.params.filename;















  const filepath = path.join(musicDirectory, filename);















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































const PORT = process.env.PORT || 3001;















app.listen(PORT, () => {















  console.log(`Backend server is running on port ${PORT}`);















});



















// Add a new endpoint to get album info

app.get('/album-info', (req, res) => {

  try {

    // Get the first image file from the images directory

    const imageFiles = fs.readdirSync(imagesDirectory)

      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));

    

    const albumCover = imageFiles.length > 0 ? imageFiles[0] : null;

    

    res.json({

      coverImage: albumCover ? `/images/${albumCover}` : null

    });

  } catch (error) {

    console.error('Error reading album info:', error);

    res.status(500).json({ error: 'Failed to read album info' });

  }

});
