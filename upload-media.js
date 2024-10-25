const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  try {
    const form = new FormData();
    const mediaDir = path.join(__dirname, 'backend', 'media');
    
    // Add MP3 files
    const files = fs.readdirSync(mediaDir);
    console.log('Found files:', files);
    
    files.forEach(file => {
      const filePath = path.join(mediaDir, file);
      console.log(`Adding ${file} to upload...`);
      form.append('files', fs.createReadStream(filePath));
    });

    // Add metadata.json
    const metadataPath = path.join(__dirname, 'backend', 'metadata.json');
    console.log('Adding metadata.json...');
    form.append('files', fs.createReadStream(metadataPath));

    console.log('Starting upload...');
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

    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

// Install required packages
const { execSync } = require('child_process');
try {
  execSync('npm install axios form-data');
} catch (error) {
  console.log('Dependencies already installed');
}

uploadFiles();
