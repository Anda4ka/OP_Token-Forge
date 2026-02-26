# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Build
RUN npm run build

# Serve stage — zero-dependency static server
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]
