#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")"

echo "Checking Railway connection..."
railway status

echo "Uploading files to /app/media..."

# Upload MP3 files
for file in backend/media/*.mp3; do
  filename=$(basename "$file")
  echo "Uploading $filename..."
  railway files upload "$file" "/app/media/$filename"
done

# Upload PNG file
for file in backend/media/*.png; do
  filename=$(basename "$file")
  echo "Uploading $filename..."
  railway files upload "$file" "/app/media/$filename"
done

# Upload metadata.json
echo "Uploading metadata.json..."
railway files upload "backend/metadata.json" "/app/metadata.json"

# List uploaded files
echo "Verifying uploads..."
railway run --service backend "dir /app/media"
