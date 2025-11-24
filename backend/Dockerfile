# ============================================================================
# VARDHMAN MILLS - BACKEND DOCKERFILE
# Multi-stage build for optimized production image
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies and build TypeScript
# ----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production --legacy-peer-deps

# ----------------------------------------------------------------------------
# Stage 2: Production - Create minimal runtime image
# ----------------------------------------------------------------------------
FROM node:22-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]

# ============================================================================
# BUILD INSTRUCTIONS:
# ============================================================================
# Build:   docker build -t vardhman-backend:latest .
# Run:     docker run -p 5000:5000 --env-file .env vardhman-backend:latest
# Debug:   docker run -it vardhman-backend:latest /bin/sh
# ============================================================================

# ============================================================================
# DOCKER COMPOSE USAGE:
# ============================================================================
# See docker-compose.yml in project root for full stack deployment
# ============================================================================
