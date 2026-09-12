FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application. Cap V8's heap so the build fails/GCs instead of
# growing unbounded - this VPS is shared with several other projects and has
# no swap, so an unbounded webpack/tsc build has taken the whole host down
# more than once.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy public folder (create empty if not exists)
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for migrations. Also copy the pinned `prisma` CLI package
# itself - without it, `npx prisma` at runtime can't find a local install and
# silently fetches whatever is currently "latest" from npm, which has broken
# this before (e.g. a new major version dropping the --skip-generate flag).
# Note: don't copy node_modules/.bin/prisma - it's a symlink to
# prisma/build/index.js, and Docker COPY dereferences it into a plain file,
# which breaks that script's relative lookup of its sibling .wasm file.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Prisma migrations and start the server. Invoke the CLI's entry file
# directly rather than via npx/`.bin/prisma` (see note above).
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
