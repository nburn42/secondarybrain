# Multi-stage Dockerfile for tandembrain application

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./
RUN npm ci

# Copy frontend source code
COPY client/ .
COPY shared/ ../shared/

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --workspace=server --workspace=shared

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/

# Build backend
RUN npm run build --workspace=server

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install only production dependencies
RUN npm ci --workspace=server --workspace=shared --omit=dev && \
    npm cache clean --force

# Copy built backend from builder
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/shared/dist ./shared/dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy necessary config files
COPY server/drizzle ./server/drizzle

# Set ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/dist/index.js"]