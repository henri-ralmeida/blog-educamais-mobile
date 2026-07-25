FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
COPY patches ./patches
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 8081

CMD ["bunx", "expo", "start", "--web", "--host", "lan"]
