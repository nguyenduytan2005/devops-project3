# Multi-stage build for the Express backend.
# Stage 1 installs production dependencies only; stage 2 copies them into a
# clean image with the source, so npm cache and dev deps never ship.

# ── Stage 1: production dependencies ─────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: lean runtime image ──────────────────────────────────────────────
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 8080
CMD ["node", "server.js"]
