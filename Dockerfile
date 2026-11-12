# Production Backend Dockerfile for SoundCraft Studio (Render)
# Lightweight Alpine Node image with native FFmpeg & QPDF
FROM node:20-alpine
WORKDIR /app

# Install native multimedia & PDF processing engines
RUN apk add --no-cache ffmpeg qpdf

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy backend source code
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server/index.js"]
