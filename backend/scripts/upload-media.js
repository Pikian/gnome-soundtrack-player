const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'https://gnome-soundtrack-player-dev.up.railway.app';
const MEDIA_DIR = path.join(__dirname, '..', 'media');

async function uploadFile(filePath) {
  const formData = new FormData();
  formData.append('files', fs.createReadStream(filePath));

  try {
    console.log(`Uploading ${path.basename(filePath)}...`);
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log(`Successfully uploaded ${path.basename(filePath)}`);
    return response.data;
  } catch (error) {
    console.error(`Error uploading ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

async function uploadAllFiles() {
  try {
    const files = fs.readdirSync(MEDIA_DIR);
    console.log(`Found ${files.length} files to upload`);

    for (const file of files) {
      const filePath = path.join(MEDIA_DIR, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        try {
          await uploadFile(filePath);
        } catch (error) {
          console.error(`Failed to upload ${file}. Continuing with next file...`);
        }
      }
    }

    console.log('All files uploaded successfully!');
  } catch (error) {
    console.error('Error during upload process:', error.message);
  }
}

uploadAllFiles(); 