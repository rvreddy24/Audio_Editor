# Multi-stage Dockerfile for SoundCraft Studio
# Stage 1: Build React Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server with FFmpeg & QPDF
FROM node:20-alpine
WORKDIR /app

# Install FFmpeg and QPDF
RUN apk add --no-cache ffmpeg qpdf

# Install Server Dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy Server Source Code
COPY server/ ./server/

# Copy Built Client Static Files
COPY --from=client-builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/index.js"]
