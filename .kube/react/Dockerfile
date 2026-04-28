# Stage 1: Build React/Vite App
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files (context will be 'web/')
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Pass production API URL as a build-time argument
ARG VITE_API_GATEWAY_URL
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Build the application
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:stable-alpine

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to NGINX public directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
