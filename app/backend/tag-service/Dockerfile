# syntax=docker/dockerfile:1

FROM node:26-alpine
WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/tag-service/package.json app/backend/tag-service/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=tag-service --include-workspace-root --no-audit --no-fund

ENV NODE_ENV=development
WORKDIR /repo/app/backend/tag-service
EXPOSE 3001
CMD ["npm", "run", "dev"]
