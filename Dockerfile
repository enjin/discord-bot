# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.1.38 as base
WORKDIR /app

# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install 

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/dist .
# migrations
COPY --from=prerelease /app/backend/db/drizzle ./backend/db/drizzle
COPY --from=prerelease /app/package.json .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "backend/index.js" ]
