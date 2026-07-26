FROM node:20-slim

# openssl é exigido pelo engine do Prisma na imagem slim.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# --omit=dev: a imagem embarcava nodemon e prisma CLI de desenvolvimento.
# O prisma CLI segue disponível via npx no runtime porque o pacote prisma é
# necessário para "migrate deploy"; por isso ele permanece em dependencies.
RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

# A imagem rodava como root sem necessidade; o usuário node já existe na base.
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
