# Build stage
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Create media directory
RUN mkdir -p /app/media

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set environment variables
ENV PORT=80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]