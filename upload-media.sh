#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")"

echo "Checking Railway connection..."
railway status

echo "Creating media directory..."
railway run --service backend "mkdir -p /app/media"

echo "Uploading files..."
for file in backend/media/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Uploading $filename..."
    railway files push "$file" "/app/media/$filename"
  fi
done

echo "Uploading metadata.json..."
railway files push backend/metadata.json /app/metadata.json

echo "Verifying uploads..."
railway run --service backend "ls -la /app/media"
