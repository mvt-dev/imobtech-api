FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      postgresql \
      postgresql-client \
      sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV VERSION=1.0.0
ENV PORT=3000
ENV DATABASE_URL=postgresql://imobtech:imobtech@localhost:5432/imobtech

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
