# Gnome Soundtrack Player

A web application for visualizing and managing game soundtrack and stem mixing. Features include:
- Track library management
- Stem mixing interface
- Delivery package tracking
- Mobile-responsive design

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gnome-soundtrack-player.git
cd gnome-soundtrack-player
```

2. Install dependencies for both frontend and backend:
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

3. Set up environment variables:
   - Copy `.env.development` to `.env` in both frontend and backend directories
   - Update the variables as needed

4. Start the development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Deployment (Railway)

The application is configured for automatic deployment through Railway's GitHub integration. When changes are pushed to the repository, Railway automatically:
1. Detects the changes
2. Triggers a new build
3. Deploys the updated version

### Backend Service

1. Create new service in Railway
   - Connect your GitHub repository
   - Select the backend service

2. Set root directory to `/backend`

3. Set environment variables:
```env
NODE_ENV=production
PORT=3001
MEDIA_DIR=/app/media
```

4. Ensure your media files are in the correct directories:
   - `/backend/media/music/` - MP3 files
   - `/backend/media/images/` - Album artwork

### Frontend Service

1. Create new service in Railway
   - Connect your GitHub repository
   - Select the frontend service

2. Set root directory to `/frontend`

3. Set environment variables:
```env
REACT_APP_API_URL=https://your-backend-service-url.railway.app
NODE_ENV=production
```

### Config Files

Both services use Railway config files for build and deploy settings:

#### Backend (backend/railway.toml)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

#### Frontend (frontend/railway.toml)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "nginx -g 'daemon off;'"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## File Structure

```
.
├── backend/
│   ├── media/
│   │   ├── music/
│   │   └── images/
│   ├── server.js
│   ├── package.json
│   └── railway.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── railway.toml
└── README.md
```

## Features

- **Track Library**: Browse and manage soundtrack tracks
- **Stem Mixer**: Mix different audio stems
- **Delivery Tracking**: Monitor delivery packages and progress
- **Mobile Support**: Responsive design with hamburger menu
- **Progress Updates**: Visual progress tracking for deliveries

## Tech Stack

- Frontend: React, CSS3
- Backend: Node.js, Express
- Deployment: Railway
- Container: Docker (Frontend)
- Server: Nginx (Frontend)



