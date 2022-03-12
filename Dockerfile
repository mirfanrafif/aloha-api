FROM node:16.13-alpine

WORKDIR /app/aloha-api

COPY package.json package.json

RUN npm install

COPY . .

EXPOSE 3000

CMD npm run start