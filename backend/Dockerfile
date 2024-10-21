FROM node:alpine3.20

WORKDIR /app

COPY . .

RUN npm i

ENTRYPOINT [ "sh", "-c", "npm run dev" ]