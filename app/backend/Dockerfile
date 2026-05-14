# syntax=docker/dockerfile:1

FROM node:26-alpine

ARG SERVICE_NAME
ARG PORT

WORKDIR /repo
COPY package.json package-lock.json ./
COPY app/backend/@shared/package.json app/backend/@shared/
COPY app/backend/${SERVICE_NAME}/package.json app/backend/${SERVICE_NAME}/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace=${SERVICE_NAME} --include-workspace-root --no-audit --no-fund

COPY app/backend/@shared/src app/backend/@shared/src

ENV NODE_ENV=development
WORKDIR /repo/app/backend/${SERVICE_NAME}
EXPOSE ${PORT}
CMD ["npm", "run", "dev"]
