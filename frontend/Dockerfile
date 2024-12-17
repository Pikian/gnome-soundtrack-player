# Build stage
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Create required directories
RUN mkdir -p /app/media /var/cache/nginx /var/run

# Copy build files and configs
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set permissions
RUN chown -R nginx:nginx /app/media /var/cache/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /app/media /var/cache/nginx /var/run /usr/share/nginx/html

# Switch to non-root user
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]