# Multi-stage build for React client
FROM node:18-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Node.js server
FROM node:18-alpine
WORKDIR /app

# Copy server package files
COPY package*.json ./
RUN npm install --only=production

# Copy server source
COPY server/ ./server/

# Copy built client
COPY --from=client-build /app/client/build ./client/build

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server/index.js"]
