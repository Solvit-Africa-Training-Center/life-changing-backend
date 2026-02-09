# Development stage
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ bash

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Update npm and suppress all warnings
RUN npm install -g npm@latest && \
    npm config set fund false && \
    npm config set audit false && \
    npm config set loglevel error

COPY package*.json ./

# Silent install - no warnings at all
RUN npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund --silent 2>/dev/null || true

COPY . .

RUN mkdir -p /app/uploads /app/logs

EXPOSE 3000

CMD ["npm", "run", "start:dev"]