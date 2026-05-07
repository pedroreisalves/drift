# syntax=docker/dockerfile:1

# ---------- deps: install the full workspace graph ----------
FROM node:26-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/post-service/package.json app/backend/post-service/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=post-service --include-workspace-root --no-audit --no-fund

# ---------- dev: watch mode via tsx, source is bind-mounted from host ----------
FROM deps AS dev
ENV NODE_ENV=development
WORKDIR /repo/app/backend/post-service
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ---------- build: compile post-service ----------
FROM deps AS build
COPY app/backend/post-service app/backend/post-service
RUN npm run build --workspace=post-service

# ---------- runtime: prod deps + compiled output ----------
FROM node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/post-service/package.json app/backend/post-service/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=post-service --omit=dev --no-audit --no-fund
COPY --from=build /repo/app/backend/post-service/dist app/backend/post-service/dist

WORKDIR /repo/app/backend/post-service
EXPOSE 3001
CMD ["node", "dist/main.js"]
