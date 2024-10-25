const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  const mediaDir = path.join(__dirname, '../backend/media');
  const files = fs.readdirSync(mediaDir);
  
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', fs.createReadStream(path.join(mediaDir, file)));
  });

  try {
    await axios.post('https://your-railway-backend-url/upload', formData, {
      headers: formData.getHeaders()
    });
    console.log('Files uploaded successfully');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

uploadFiles();
