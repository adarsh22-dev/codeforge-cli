FROM node:22-slim AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN npm install -g bun && bun install --frozen-lockfile
COPY . .
RUN bun run build
RUN npm prune --production

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/bin /app/bin
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep && \
    rm -rf /var/lib/apt/lists/*
RUN useradd -m -s /bin/bash codeforge
USER codeforge
ENTRYPOINT ["node", "/app/dist/cli.mjs"]
