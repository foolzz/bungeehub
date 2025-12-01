# DeliveryHub - Dockerfile
# Multi-stage build for production (API + Web)

# Stage 1: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source code
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build backend application
RUN npm run build

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY web ./

# Build frontend (static export)
RUN npm run build

# Stage 3: Production
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client in production
RUN npx prisma generate

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built frontend from builder to public/web (where ServeStaticModule expects it)
COPY --from=frontend-builder /app/web/out ./public/web

# Copy mockups to public/web/mockups
COPY public/web/mockups ./public/web/mockups

# Expose port
EXPOSE 8080

# Set environment variable for production
ENV NODE_ENV=production

# Start application
CMD ["node", "dist/main"]
