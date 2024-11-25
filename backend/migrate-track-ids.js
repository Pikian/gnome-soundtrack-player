const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function migrateTrackIds() {
  try {
    // Path to your trackList.json
    const trackListPath = path.join(__dirname, 'media', 'trackList.json');
    
    // Create backup before migration
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, 'media', 'backups', `trackList-pre-migration-${timestamp}.json`);
    
    // Ensure backup directory exists
    const backupDir = path.join(__dirname, 'media', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Read current track list
    const data = await readFile(trackListPath, 'utf8');
    const trackList = JSON.parse(data);
    
    // Create backup
    await writeFile(backupPath, data);
    console.log(`Backup created at: ${backupPath}`);

    // Helper function to update track IDs
    const updateTrackIds = (tracks, parentId = null) => {
      return tracks.map(track => {
        if (!track) return null;

        const baseId = track.title.toLowerCase().replace(/\s+/g, '-');
        const newId = parentId ? `${parentId}-${baseId}` : baseId;
        
        // Store old ID for logging
        const oldId = track.id;
        
        // Create updated track object
        const updatedTrack = {
          ...track,
          id: newId
        };

        // Log the ID change
        if (oldId !== newId) {
          console.log(`Updated ID: ${oldId} -> ${newId}`);
        }

        // Recursively update subtracks if they exist
        if (updatedTrack.subtracks) {
          updatedTrack.subtracks = updateTrackIds(updatedTrack.subtracks, newId);
        }

        return updatedTrack;
      });
    };

    // Update IDs in each section
    const sections = ['score', 'gnomeMusic', 'outsideScope', 'bonusUnassigned'];
    sections.forEach(section => {
      if (trackList[section]) {
        console.log(`\nUpdating ${section} section...`);
        trackList[section] = updateTrackIds(trackList[section]);
      }
    });

    // Save updated track list
    const updatedData = JSON.stringify(trackList, null, 2);
    await writeFile(trackListPath, updatedData);
    
    console.log('\nMigration completed successfully!');
    console.log('A backup of your original trackList.json has been created.');
    console.log('\nIf you need to rollback, copy the backup file back to trackList.json');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTrackIds().then(() => {
  console.log('\nMigration script finished.');
}).catch(error => {
  console.error('Migration script failed:', error);
}); 