FROM node:22-alpine

WORKDIR /app

# Install deps first for layer caching
COPY package*.json ./
RUN npm ci --production

# Copy app
COPY . .

# Create data directory for SQLite
RUN mkdir -p data logs/transcripts logs/stats

EXPOSE 3100

CMD ["node", "server.js"]
