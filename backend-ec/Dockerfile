FROM node:18 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install --loglevel=error

COPY . . 

RUN npm run build

FROM node:18

WORKDIR /app

COPY package*.json ./ 

COPY .env.default .env
COPY .env.default .env.production
COPY .env.default .env.staging
COPY .env.default .env.test

COPY medusa-config.js .

RUN npm i --production

COPY --from=builder /app/dist ./dist
COPY templates ./templates

EXPOSE 9000

ENTRYPOINT ["node", "dist/main.js"]
