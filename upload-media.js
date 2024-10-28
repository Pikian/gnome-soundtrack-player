const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  try {
    // First, get list of existing files
    console.log('Checking existing files...');
    const existingFiles = await axios.get('https://backend-production-e957.up.railway.app/debug-media');
    console.log('Current files on server:', existingFiles.data.files);

    // Prepare new files
    const form = new FormData();
    const mediaDir = path.join(__dirname, 'backend', 'media');
    const localFiles = fs.readdirSync(mediaDir);
    
    console.log('\nFound local files:', localFiles);
    
    // Compare files
    const newFiles = localFiles.filter(file => !existingFiles.data.files.includes(file));
    const duplicateFiles = localFiles.filter(file => existingFiles.data.files.includes(file));
    
    if (duplicateFiles.length > 0) {
      console.log('\nSkipping duplicate files:', duplicateFiles);
    }

    if (newFiles.length === 0) {
      console.log('\nNo new files to upload.');
      return;
    }

    console.log('\nPreparing to upload new files:', newFiles);
    
    // Add only new files to form
    newFiles.forEach(file => {
      const filePath = path.join(mediaDir, file);
      console.log(`Adding ${file} to upload...`);
      form.append('files', fs.createReadStream(filePath));
    });

    // Add metadata.json
    const metadataPath = path.join(__dirname, 'backend', 'metadata.json');
    console.log('Adding metadata.json...');
    form.append('files', fs.createReadStream(metadataPath));

    console.log('\nStarting upload...');
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

    console.log('\nUpload response:', response.data);
  } catch (error) {
    console.error('\nUpload failed:', error.response?.data || error.message);
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
