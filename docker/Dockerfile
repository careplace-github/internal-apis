FROM node:14.15.4-alpine3.12

ENV NODE_ENV = production

WORKDIR /usr/src/app

COPY package.json /usr/src/app

COPY . /usr/src/app

RUN npm cache clear --force

RUN npm install --legacy-peer-deps

ENV PORT = 8080

EXPOSE 8080

CMD [ "npm", "start" ]

