# Gnome - The Story of a Revel Soundtrack Player

A web application to stream the original soundtrack of Gnome - The Story of a Revel.

## Development Setup

### Backend
1. Install dependencies:   ```bash
   cd backend
   npm install   ```

2. Create `.env` file:   ```
   PORT=3001   ```

3. Add MP3 files to `/backend/music`
4. Add album artwork to `/backend/images`
5. Start development server:   ```bash
   npm run dev   ```

### Frontend
1. Install dependencies:   ```bash
   cd frontend
   npm install   ```

2. Create `.env.development`:   ```
   REACT_APP_API_URL=http://localhost:3001   ```

3. Start development server:   ```bash
   npm run dev   ```

## Deployment

### Railway Setup
1. Create two services: backend and frontend
2. Set environment variables for both services
3. Configure root directories:
   - Backend: `/backend`
   - Frontend: `/frontend`
4. Deploy both services

### Environment Variables
Backend (Railway):
- `PORT`: Set by Railway
- `NODE_ENV`: Set to "production"

Frontend (Railway):
- `REACT_APP_API_URL`: Your backend service URL
