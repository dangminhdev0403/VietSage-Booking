FROM node:22-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# Ephemeral build-only value; the runtime secret is supplied via env_file.
RUN BUILD_AUTH_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")" \
    && NEXTAUTH_SECRET="$BUILD_AUTH_SECRET" AUTH_SECRET="$BUILD_AUTH_SECRET" pnpm run build

FROM node:22-alpine AS runtime

WORKDIR /app
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node -e \"const s=process.env.AUTH_SECRET||process.env.NEXTAUTH_SECRET;if(!s||s.length<32||/(replace_with|changeme|<redacted>|«redacted:)/i.test(s))throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be a non-placeholder value of at least 32 characters')\" && exec node server.js"]
