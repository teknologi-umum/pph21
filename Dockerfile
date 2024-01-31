FROM oven/bun:1.0.25-debian
WORKDIR /app
RUN apt-get update && apt-get install -y curl wget
COPY . .
RUN bun install --frozen-lockfile --production
RUN bun build index.ts --compile --outfile=server
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "index.ts" ]