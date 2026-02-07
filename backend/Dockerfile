FROM node:lts

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

WORKDIR /code

ARG PORT=3100
ENV PORT=$PORT
EXPOSE $PORT

COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci

HEALTHCHECK --interval=30s \
CMD node healthcheck.js

COPY . /code
RUN npx prisma generate

CMD [ "sh", "-c", "npm run db:deploy && npm run start:dev" ]