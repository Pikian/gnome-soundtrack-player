const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://gnome-soundtrack-player-dev.up.railway.app';
const MIGRATION_KEY = process.env.MIGRATION_KEY;

if (!MIGRATION_KEY) {
  console.error('Error: MIGRATION_KEY environment variable is required');
  process.exit(1);
}

async function fixTrackIds() {
  try {
    console.log('Starting track ID migration...');
    console.log('Using API URL:', API_URL);
    
    const response = await axios.post(`${API_URL}/migrate-track-ids`, {}, {
      headers: {
        'x-migration-key': MIGRATION_KEY
      }
    });

    if (response.data.success) {
      console.log('Migration completed successfully!');
      console.log('Backup created at:', response.data.backupPath);
      console.log('Track IDs have been updated.');
    } else {
      throw new Error('Migration failed');
    }
  } catch (error) {
    console.error('Error during migration:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('Authentication failed. Please check your MIGRATION_KEY.');
    }
    process.exit(1);
  }
}

// Run the migration
fixTrackIds(); 