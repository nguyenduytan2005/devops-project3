# Multi-stage build for the React frontend.
# Stage 1 compiles the app into static files; stage 2 serves only build/
# with `serve`, so node_modules and source never ship.

# ── Stage 1: build the static bundle ─────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# REACT_APP_* values are baked into the JavaScript bundle at BUILD time
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# ── Stage 2: serve the static files ──────────────────────────────────────────
FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/build ./build
USER node
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
