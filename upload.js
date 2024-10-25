const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  try {
    const form = new FormData();
    const mediaDir = path.join(__dirname, 'backend', 'media');
    
    console.log('Reading media directory:', mediaDir);
    
    // Add all files from the media directory
    const files = fs.readdirSync(mediaDir);
    files.forEach(file => {
      const filePath = path.join(mediaDir, file);
      console.log(`Adding ${file} to upload...`);
      form.append('files', fs.createReadStream(filePath), {
        filename: file,
        contentType: file.endsWith('.mp3') ? 'audio/mpeg' : 'image/png'
      });
    });

    // Add metadata.json
    const metadataPath = path.join(__dirname, 'backend', 'metadata.json');
    console.log('Adding metadata.json...');
    form.append('files', fs.createReadStream(metadataPath), {
      filename: 'metadata.json',
      contentType: 'application/json'
    });

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

uploadFiles();
