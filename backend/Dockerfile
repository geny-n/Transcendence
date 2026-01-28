FROM node:20-alpine AS development

#ARG NODE_ENV=production
#ENV NODE_ENV $NODE_ENV

WORKDIR /code

ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT

COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci

COPY prisma /code/prisma
RUN npx prisma generate

COPY . /code

RUN npx tsc

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

HEALTHCHECK --interval=30s \
    CMD [ "node", "healthcheck.js" ]

#CMD ["/bin/sh", "-c", "npx prisma db push && npx prisma generate && node dist/index.js"]
CMD ["/bin/sh", "-c", "npx prisma db push && node dist/index.js"]

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
