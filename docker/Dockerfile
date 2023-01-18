FROM node:16

ENV HOME /usr/src/

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT = 8080

EXPOSE 8080

CMD [ "npm", "start" ]

