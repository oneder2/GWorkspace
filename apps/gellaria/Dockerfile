FROM node:22-bookworm-slim AS builder

WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/gellaria/package.json apps/gellaria/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace @gworkspace/gellaria --include-workspace-root=false

COPY apps/gellaria apps/gellaria
COPY packages/contracts packages/contracts
RUN npm run build:gellaria

FROM node:22-bookworm-slim AS runner

WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/gellaria/package.json apps/gellaria/package.json
COPY packages/contracts packages/contracts
RUN npm ci --omit=dev --workspace @gworkspace/gellaria --include-workspace-root=false \
  && npm cache clean --force

COPY --from=builder /repo/apps/gellaria/.next apps/gellaria/.next
COPY apps/gellaria/server.ts apps/gellaria/next.config.ts apps/gellaria/tsconfig.json apps/gellaria/
COPY apps/gellaria/lib apps/gellaria/lib

EXPOSE 3000
VOLUME ["/data"]
CMD ["npm", "run", "start", "--workspace", "@gworkspace/gellaria"]
