const axios = require('axios');

async function triggerMigration() {
  try {
    console.log('Triggering migration...');
    
    const response = await axios.post(
      'https://backend-production-e957.up.railway.app/migrate-track-ids',
      {},
      {
        headers: {
          'x-migration-key': 'gnome-soundtrack-2024',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Migration response:', response.data);
  } catch (error) {
    console.error('Migration failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error details:', error.response.data);
    }
  }
}

triggerMigration(); 