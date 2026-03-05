# ============================================================
# Multi-stage Dockerfile for MedMinder API (NestJS + Prisma)
# ============================================================

# --- Stage 1: Base ---
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# --- Stage 2: Prune ---
FROM base AS pruner
COPY . .
# Extract only the API workspace and its dependencies
RUN turbo prune --scope=api --docker

# --- Stage 3: Build ---
FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/npm-lock.yaml ./npm-lock.yaml
# Install all dependencies (including dev)
RUN npm install

COPY --from=pruner /app/out/full/ .
# Generate Prisma Client
RUN cd packages/api && npx prisma generate
# Build the API
RUN turbo run build --filter=api

# --- Stage 4: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy necessary files from builder
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules

# Expose API port
EXPOSE 4000

# Start command
WORKDIR /app/packages/api
CMD ["npm", "run", "start:prod"]
