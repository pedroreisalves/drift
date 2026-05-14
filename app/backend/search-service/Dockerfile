# syntax=docker/dockerfile:1

FROM node:26-alpine
WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/@shared/package.json app/backend/@shared/
COPY app/backend/search-service/package.json app/backend/search-service/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=search-service --include-workspace-root --no-audit --no-fund

COPY app/backend/@shared/src app/backend/@shared/src

ENV NODE_ENV=development
WORKDIR /repo/app/backend/search-service
EXPOSE 3002
CMD ["npm", "run", "dev"]
