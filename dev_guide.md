# Gnome Soundtrack Player - Developer Guide

## Overview
The Gnome Soundtrack Player is a web application for managing and playing the soundtrack for the game "Gnome - The Story of a Revel". It consists of a React frontend and a Node.js/Express backend.

## Project Structure

gnome-soundtrack-player/
├── frontend/ # React frontend application
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── App.js # Main application component
│ │ └── index.js # Application entry point
│ └── package.json
├── backend/ # Express backend server
│ ├── media/ # Audio files and track data
│ │ └── packages/ # Milestone delivery packages
│ ├── server.js # Main server file
│ └── package.json
└── package.json # Root package.json for utilities


## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Railway CLI (for deployment)

### Local Development Setup

1. Clone the repository:

bash
git clone https://github.com/yourusername/gnome-soundtrack-player.git
cd gnome-soundtrack-player

2. Install dependencies:

bash
Install backend dependencies
cd backend
npm install
Install frontend dependencies
cd ../frontend
npm install


3. Set up environment variables:

Create `.env` files in both frontend and backend directories:

env
frontend/.env
REACT_APP_API_URL=http://localhost:8080
backend/.env
PORT=8080
CORS_ORIGIN=http://localhost:3000

4. Start the development servers:
bash
Start backend (from backend directory)
npm run dev
Start frontend (from frontend directory)
npm start


## Key Features

### Authentication
- Simple password protection for main app (`bark`)
- Separate manager authentication (`zimmer`)

### Track Management
- Organize tracks in sections: Score, Gnome Music, Outside Scope, Bonus
- Support for main tracks and subtracks
- Track statuses: ready, planned
- File upload and management
- Section visibility control
- Section reordering

### Stem Mixer
- Mix different stems of tracks
- Save and load custom mixes
- Real-time volume control for each stem
- Support for alternative stems

### Milestone Delivery
- Package downloads for different milestones
- Organized music packages (Main, Warm, Diegetic)
- Preview in digital library
- Future milestone previews

## API Endpoints

### Track Management
- `GET /track-list` - Get all tracks
- `POST /track-list/save` - Save track list
- `POST /track-list/add` - Add new track
- `POST /track-list/update` - Update track details
- `PUT /sections/:sectionId/visibility` - Toggle section visibility
- `PUT /sections/:sectionId/reorder` - Reorder sections

### File Management
- `POST /upload` - Upload audio files
- `GET /tracks` - Get list of available files
- `GET /tracks/:filename` - Stream audio file
- `GET /tracks/:filename/download` - Download audio file

### Stem Mixer
- `GET /stem-mixes/:trackId` - Get saved mixes for a track
- `POST /stem-mixes/:trackId` - Save new mix

### Milestone Delivery
- `GET /download-package/:packageName` - Download milestone package

## Component Structure

### Main Components
- `TrackList` - Main track listing and playback
- `TrackPlayer` - Audio player component
- `StemMixer` - Stem mixing interface
- `TrackManager` - Track management interface
- `MilestoneDelivery` - Milestone package downloads

### Helper Components
- `Navigation` - App navigation with logo
- `Login` - Authentication screens
- `TrackEditor` - Track editing modal
- `SectionManager` - Section management interface

## Deployment

The application is deployed on Railway.app:

1. Install Railway CLI:
bash
npm i -g @railway/cli

2. Login to Railway:
bash
railway login

3. Link your project:
bash
railway link

4. Deploy:
bash
railway up


## Common Tasks

### Adding a New Track
1. Access Track Manager
2. Click "Edit"
3. Use "Add Track" button in desired section
4. Fill in track details
5. Upload audio file if available

### Creating Stem Mixes
1. Navigate to Stem Mixer
2. Select a track with stems
3. Adjust stem volumes
4. Save mix with custom name

### Managing Sections
1. Access Track Manager
2. Use section controls to:
   - Hide/Show sections
   - Reorder sections
   - Rename sections

### Preparing Milestone Packages
1. Create package directories in backend/media/packages/
2. Organize files into appropriate packages:
   - dark-forest-main/
   - dark-forest-warm/
   - gnome-diegetic/

### Troubleshooting

Common issues and solutions:

1. **Audio not playing**
   - Check file paths in trackList.json
   - Verify file exists in media directory
   - Check browser console for errors

2. **Upload failures**
   - Verify file size (max 100MB)
   - Check media directory permissions
   - Ensure valid audio format

3. **CORS errors**
   - Verify CORS_ORIGIN in backend .env
   - Check frontend API_URL configuration

4. **Package downloads failing**
   - Verify package directories exist
   - Check file permissions
   - Ensure files are properly organized

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## Support

For technical support or questions:
1. Check existing documentation
2. Review server logs
3. Contact development team
