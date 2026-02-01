# Stage 1: Build the Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json package-lock.json ./

RUN npm ci

# Copy source code
COPY . .

# Build-time env vars (injected by Coolify or docker build --build-arg)
ARG VITE_POCKETBASE_URL

# Prevent Vite/SWC from running out of memory on constrained builders
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
