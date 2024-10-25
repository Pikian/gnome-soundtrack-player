# Gnome Soundtrack Player

A web application for playing the Gnome soundtrack.

## Development Setup

1. Clone the repository:



## Deployment (Railway)



### Backend Service

1. Create new service in Railway

2. Set root directory to `/backend`

3. Set environment variables:   ```

   NODE_ENV=production   ```

4. Ensure your music files and images are in the correct directories:

   - `/backend/music/` - MP3 files

   - `/backend/images/` - Album artwork



### Frontend Service

1. Create new service in Railway

2. Set root directory to `/frontend`

3. Set environment variables:   ```

   REACT_APP_API_URL=https://your-backend-service-url.railway.app   ```



### Config Files

Both services use Railway config files for build and deploy settings:

- `backend/railway.toml`

- `frontend/railway.toml`



## File Structure



