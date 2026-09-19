# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lockfile first so Docker layer cache is only busted on dependency changes
COPY package.json package-lock.json ./

# ci is faster & deterministic — uses package-lock.json exactly, no network surprises
RUN npm ci --prefer-offline

COPY . .

RUN npm run build

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./

# Install only runtime deps (no devDependencies)
RUN npm ci --omit=dev --prefer-offline

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
