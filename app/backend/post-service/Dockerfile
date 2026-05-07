# syntax=docker/dockerfile:1

FROM node:26-alpine
WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/post-service/package.json app/backend/post-service/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=post-service --include-workspace-root --no-audit --no-fund

ENV NODE_ENV=development
WORKDIR /repo/app/backend/post-service
EXPOSE 3001
CMD ["npm", "run", "dev"]
