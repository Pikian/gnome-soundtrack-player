const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadToVolume() {
  try {
    const form = new FormData();
    const mediaDir = path.join(__dirname, 'backend', 'media');
    
    // Add all files from media directory
    const files = fs.readdirSync(mediaDir);
    console.log('Found files to upload:', files);
    
    files.forEach(file => {
      const filePath = path.join(mediaDir, file);
      console.log(`Adding ${file} to upload...`);
      form.append('files', fs.createReadStream(filePath));
    });

    // Add metadata.json
    const metadataPath = path.join(__dirname, 'backend', 'metadata.json');
    console.log('Adding metadata.json...');
    form.append('files', fs.createReadStream(metadataPath));

    console.log('Starting upload to Railway volume...');
    const response = await axios.post(
      'https://backend-production-e957.up.railway.app/upload',
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('Upload response:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

uploadToVolume();
