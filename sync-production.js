import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PRODUCTION_URL = 'https://backend-production-e957.up.railway.app'; // Railway backend URL
const LOCAL_MEDIA_DIR = path.join(__dirname, 'backend', 'media');

// Ensure media directory exists
if (!fs.existsSync(LOCAL_MEDIA_DIR)) {
    fs.mkdirSync(LOCAL_MEDIA_DIR, { recursive: true });
}

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 401) {
                reject(new Error('Unauthorized'));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => reject(err));
        });
    });
}

async function main() {
    try {
        console.log('Fetching track list from production...');
        
        // First, get the track list
        const trackListResponse = await fetch(`${PRODUCTION_URL}/track-list`);

        if (trackListResponse.status === 401) {
            throw new Error('Unauthorized - check your password');
        }

        const trackList = await trackListResponse.json();
        
        // Save track list locally
        fs.writeFileSync(
            path.join(LOCAL_MEDIA_DIR, 'trackList.json'),
            JSON.stringify(trackList, null, 2)
        );
        console.log('✓ Track list downloaded');

        // Create directory for stem mixes if it doesn't exist
        const mixesDir = path.join(LOCAL_MEDIA_DIR, 'stem-mixes');
        if (!fs.existsSync(mixesDir)) {
            fs.mkdirSync(mixesDir, { recursive: true });
        }

        // Helper function to extract all track IDs
        function extractTrackIds(tracks) {
            let ids = [];
            for (const track of tracks) {
                if (track.id) {
                    ids.push(track.id);
                }
                if (track.subtracks) {
                    ids = ids.concat(extractTrackIds(track.subtracks));
                }
            }
            return ids;
        }

        // Get all track IDs from all sections
        const trackIds = [
            ...extractTrackIds(trackList.score || []),
            ...extractTrackIds(trackList.gnomeMusic || []),
            ...extractTrackIds(trackList.outsideScope || []),
            ...extractTrackIds(trackList.bonusUnassigned || [])
        ];

        console.log(`Found ${trackIds.length} tracks to check for mixes`);

        // Fetch and save stem mixes for each track
        for (const trackId of trackIds) {
            console.log(`Fetching mixes for track ${trackId}...`);
            try {
                const mixesResponse = await fetch(`${PRODUCTION_URL}/stem-mixes/${trackId}`);
                if (mixesResponse.ok) {
                    const mixes = await mixesResponse.json();
                    if (mixes && Object.keys(mixes).length > 0) {
                        fs.writeFileSync(
                            path.join(mixesDir, `${trackId}-mixes.json`),
                            JSON.stringify(mixes, null, 2)
                        );
                        console.log(`✓ Saved mixes for track ${trackId}`);
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch mixes for track ${trackId}:`, err);
            }
        }

        // Helper function to extract all filenames from track list
        function extractFilenames(tracks) {
            let filenames = [];
            for (const track of tracks) {
                if (track.filename) {
                    filenames.push(track.filename);
                }
                if (track.subtracks) {
                    filenames = filenames.concat(extractFilenames(track.subtracks));
                }
            }
            return filenames;
        }

        // Get all filenames from all sections
        const filenames = [
            ...extractFilenames(trackList.score || []),
            ...extractFilenames(trackList.gnomeMusic || []),
            ...extractFilenames(trackList.outsideScope || []),
            ...extractFilenames(trackList.bonusUnassigned || [])
        ];

        console.log(`Found ${filenames.length} files to download`);

        // Download each file
        for (const filename of filenames) {
            if (!filename) continue;
            
            const destPath = path.join(LOCAL_MEDIA_DIR, filename);
            if (fs.existsSync(destPath)) {
                console.log(`${filename} already exists, skipping...`);
                continue;
            }

            console.log(`Downloading ${filename}...`);
            try {
                await downloadFile(
                    `${PRODUCTION_URL}/media/${encodeURIComponent(filename)}`,
                    destPath
                );
                console.log(`✓ Downloaded ${filename}`);
            } catch (err) {
                console.error(`Failed to download ${filename}:`, err);
            }
        }

        console.log('\nSync completed!');
        console.log(`Files are synced to: ${LOCAL_MEDIA_DIR}`);

    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

main(); 