const fs = require('fs');
const path = require('path');

// Constants
const MEDIA_DIR = path.join(__dirname, '..', 'media');
const TRACK_LIST_PATH = path.join(MEDIA_DIR, 'trackList.json');

// Sample track list structure
const sampleTrackList = {
  "score": [
    {
      "id": "score-dark-forest-main",
      "title": "The Dark Forest (Main)",
      "status": "ready",
      "filename": "dark-forest-main.mp3",
      "subtracks": [
        {
          "id": "score-dark-forest-main-stem1",
          "title": "The Dark Forest (Main) - Stem 1",
          "status": "ready",
          "filename": "dark-forest-main-stem1.mp3",
          "type": "substem"
        },
        {
          "id": "score-dark-forest-main-stem2",
          "title": "The Dark Forest (Main) - Stem 2",
          "status": "ready",
          "filename": "dark-forest-main-stem2.mp3",
          "type": "substem"
        }
      ]
    }
  ],
  "gnomeMusic": [
    {
      "id": "gnome-music-ballad-1",
      "title": "Ballad of the Brave (Demo 1)",
      "status": "ready",
      "filename": "ballad-brave-demo1.mp3"
    }
  ],
  "bonusUnassigned": [
    {
      "id": "bonus-track-1",
      "title": "Bonus Track 1",
      "status": "ready",
      "filename": "bonus-track-1.mp3"
    }
  ]
};

// Create placeholder MP3 files
const createPlaceholderMP3 = (filepath) => {
  // Create a minimal valid MP3 file (44 bytes)
  const minimalMP3 = Buffer.from([
    0xFF, 0xFB, 0x90, 0x44, // MPEG-1 Layer 3 header
    0x00, 0x00, 0x00, 0x00, // Empty frame
    // ... repeat for a few more frames
  ]);
  
  fs.writeFileSync(filepath, minimalMP3);
};

// Initialize media directory
console.log('Initializing local media directory...');

// Create media directory if it doesn't exist
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Create track list file
fs.writeFileSync(TRACK_LIST_PATH, JSON.stringify(sampleTrackList, null, 2));
console.log('Created track list file');

// Create placeholder MP3 files for all tracks
const createPlaceholdersForSection = (section) => {
  section.forEach(track => {
    if (track.filename) {
      const filepath = path.join(MEDIA_DIR, track.filename);
      createPlaceholderMP3(filepath);
      console.log(`Created placeholder for ${track.filename}`);
    }
    if (track.subtracks) {
      createPlaceholdersForSection(track.subtracks);
    }
  });
};

Object.values(sampleTrackList).forEach(section => {
  createPlaceholdersForSection(section);
});

console.log('Local media directory initialized successfully!'); 