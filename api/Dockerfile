# API Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies first
COPY api/package*.json ./
# Use npm install to avoid lockfile mismatch during container builds
RUN npm install --omit=dev

# Copy source
COPY api/. ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
