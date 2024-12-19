# Gnome Soundtrack Player

A web-based audio player and stem mixer application for managing and playing game soundtracks. The application supports stem-based mixing, playlist management, and delivery package creation.

## Project Structure

```
gnome-soundtrack-player/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/             # Static files
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── nginx.conf        # Nginx configuration for production
│   └── .env*            # Environment configurations
├── backend/            # Node.js backend server
│   ├── server.js      # Main server file
│   ├── scripts/      # Utility scripts
│   ├── media/       # Media storage directory
│   ├── persistent/ # Persistent data storage
│   └── railway.toml # Railway deployment configuration
├── package.json    # Root package configuration
└── README.md     # Project documentation
```

## Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker Desktop
- Git

### Environment Variables

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
PORT=3000
```

#### Backend (.env)
```
PORT=3001
CORS_ORIGIN=http://localhost:3000
STORAGE_PATH=./media
```

### Starting the Development Environment

1. Clone the repository:
```bash
git clone https://github.com/Pikian/gnome-soundtrack-player.git
cd gnome-soundtrack-player
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Start the development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend (in a new terminal)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Build and Deployment

### Docker Build Process

1. Frontend Build:
```bash
cd frontend
docker build -t gnome-player-frontend .
```

2. Backend Build:
```bash
cd backend
docker build -t gnome-player-backend .
```

### Deployment Configuration

The project uses Railway for deployment. Each branch has its own deployment:
- `main`: Production environment
- `dev`: Development/staging environment

#### Railway Configuration

The project uses `railway.toml` for deployment configuration:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "on-failure"
```

### Media Storage

The application uses a mounted storage volume for media files:
- Local: `./backend/media/`
- Production: Mounted volume on Railway

## Features

### Stem Mixer

The stem mixer component (`frontend/src/components/StemMixer.js`) provides:
- Individual stem control
- Volume adjustment
- Mix saving/loading
- Playback controls

Key considerations:
- Handles empty/placeholder tracks gracefully
- Supports asynchronous audio loading
- Provides error handling for missing files

### Track Management

- Upload new tracks
- Create and manage playlists
- Assign stems to tracks
- Delete tracks and stems

### Delivery System

- Create delivery packages
- Download stem bundles
- Dynamic delivery page content
- Custom package descriptions

## Development Workflow

1. Create a new feature branch from `dev`:
```bash
git checkout dev
git pull
git checkout -b feature/your-feature-name
```

2. Make changes and test locally

3. Push changes to the feature branch:
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

4. Create a pull request to merge into `dev`

5. After testing on `dev`, merge to `main` for production deployment

## Troubleshooting

### Common Issues

1. 502 Bad Gateway
- Check CORS configuration
- Verify backend health endpoint
- Check Railway logs

2. Audio Loading Issues
- Verify file exists in storage
- Check file permissions
- Check browser console for errors

3. Build Failures
- Verify Node.js version
- Check dependency versions
- Review Railway build logs

### Debugging

1. Backend Logs:
```bash
# Local
npm run dev

# Production
railway logs
```

2. Frontend Development:
- Use React DevTools
- Check browser console
- Enable debug logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

[Add your license information here]



