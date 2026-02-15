FROM node:lts

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

WORKDIR /code

ARG PORT=3100
ENV PORT=$PORT
EXPOSE $PORT

COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN apt-get update && apt-get install -y \
    openssl && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/backend-selfsigned.key \
    -out /etc/ssl/certs/backend-selfsigned.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42 School/CN=gtoure.42.fr"

RUN npm ci

HEALTHCHECK --interval=30s \
CMD node healthcheck.js

COPY . /code
RUN npx prisma generate

CMD [ "sh", "-c", "npm run db:deploy && npm run start:dev" ]