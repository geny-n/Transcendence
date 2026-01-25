FROM node:lts AS development

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /code

ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT

COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci

HEALTHCHECK --interval=30s \
CMD [ "node healthcheck.js" ]

COPY . /code

CMD [ "npx prisma migrate dev --name init && npx prisma generate && node ./dist/index.js" ]

# FROM development as dev-envs
# RUN <<EOF
# apt-get update
# apt-get install --no-install-recommends git
# EOF

# RUN <<EOF
# useradd -s /bin/bash -m vscode
# grouppadd docker
# usermod -aG docker vscode
# EOF

# COPY --from=gloursdocker/docker / /
