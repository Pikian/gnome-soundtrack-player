const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function uploadFile(localPath, remotePath) {
  try {
    console.log(`Uploading ${localPath} to ${remotePath}`);
    const command = `railway files upload "${localPath}" "${remotePath}"`;
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to upload ${localPath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    // Upload MP3 files
    const mediaDir = path.join(__dirname, 'backend', 'media');
    const files = fs.readdirSync(mediaDir);
    
    for (const file of files) {
      const localPath = path.join(mediaDir, file);
      const remotePath = `/app/media/${file}`;
      uploadFile(localPath, remotePath);
    }

    // Upload metadata.json
    const metadataPath = path.join(__dirname, 'backend', 'metadata.json');
    uploadFile(metadataPath, '/app/metadata.json');

    console.log('Upload complete!');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

main();
