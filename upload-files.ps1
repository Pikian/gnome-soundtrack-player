# First, install multer in backend if not already installed
Write-Host "Installing multer..."
Set-Location backend
npm install multer
Set-Location ..

# Create a simple Node.js script to handle the upload
$uploadScript = @"
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  const form = new FormData();
  
  // Add MP3 files
  const mp3Files = fs.readdirSync('./backend/media').filter(f => f.endsWith('.mp3'));
  mp3Files.forEach(file => {
    form.append('files', fs.createReadStream(`./backend/media/${file}`));
  });
  
  // Add image files
  const imageFiles = fs.readdirSync('./backend/media').filter(f => 
    f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.gif')
  );
  imageFiles.forEach(file => {
    form.append('files', fs.createReadStream(`./backend/media/${file}`));
  });

  try {
    const response = await axios.post(
      'https://backend-production-e957.up.railway.app/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
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

uploadFiles();
"@

# Save the script
$uploadScript | Out-File -Encoding UTF8 upload.js

# Install required packages
npm install axios form-data

# Run the upload script
Write-Host "Uploading files..."
node upload.js

# Clean up
Remove-Item upload.js
Write-Host "Upload process completed!"
