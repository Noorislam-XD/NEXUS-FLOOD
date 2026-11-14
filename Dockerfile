# Multi-stage Dockerfile for NEXUS FLOOD (Google Cloud Run / Free-tier hosting)

# Stage 1: Build the frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm ci

# Copy frontend source and configuration
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY src ./src
COPY public ./public

# Build frontend to dist/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server package and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server source code
COPY server/ ./

# Cloud Run defaults to PORT 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
