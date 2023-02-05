FROM node:14.15.4-alpine3.12

WORKDIR /usr/src/app

COPY package.json /usr/src/app

COPY . /usr/src/app

RUN npm cache clear

RUN npm install --legacy-peer-deps

CMD [ "npm", "start" ]

