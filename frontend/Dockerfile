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

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Set environment variable for nginx template processing
ENV PORT=80

# Use the official nginx Docker image's entrypoint script
EXPOSE ${PORT}
CMD ["nginx", "-g", "daemon off;"]