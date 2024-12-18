const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://gnome-soundtrack-player-dev.up.railway.app';
const MIGRATION_KEY = 'your-secret-key'; // You'll need to set this in your environment

async function fixTrackIds() {
  try {
    console.log('Starting track ID migration...');
    
    const response = await axios.post(`${API_URL}/migrate-track-ids`, {}, {
      headers: {
        'x-migration-key': MIGRATION_KEY
      }
    });

    if (response.data.success) {
      console.log('Migration completed successfully!');
      console.log('Backup created at:', response.data.backupPath);
    } else {
      throw new Error('Migration failed');
    }
  } catch (error) {
    console.error('Error during migration:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the migration
fixTrackIds(); 