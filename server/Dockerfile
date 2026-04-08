FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY server/package.json server/package.json
WORKDIR /app/server
RUN npm install

COPY server/ .
RUN npx tsc

FROM node:22-alpine

LABEL org.opencontainers.image.title="Pravko" \
      org.opencontainers.image.description="Pravko video review platform" \
      org.opencontainers.image.source="https://github.com/nicenathapong/Pravko"

RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./package.json
COPY server/db/schema.sql ./db/schema.sql

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
