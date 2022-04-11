# build
FROM node:16.13-alpine as build

ENV NODE_ENV build

WORKDIR /app/aloha-api

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build && npm prune --production

# run 
FROM node:16.13-alpine

ENV NODE_ENV production

WORKDIR /app/aloha-api

EXPOSE 3000

COPY --from=build /app/aloha-api/package*.json ./
COPY --from=build /app/aloha-api/node_modules/ ./node_modules/
COPY --from=build /app/aloha-api/dist/ ./dist/

CMD node dist/main.js