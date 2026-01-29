# Build React app seulement
FROM node:20-alpine AS builder
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./
#RUN npm install
RUN npm ci
#RUN npm ci --only=production=false

# Copier tout le code source
COPY . .

# Build de production
RUN npm run build

# Ne pas utiliser nginx ici, juste exposer les fichiers
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/dist /app/dist
CMD ["tail", "-f", "/dev/null"]