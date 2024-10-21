FROM node:alpine3.20

WORKDIR /app

COPY . .

RUN rm -r node_modules
RUN npm i

ENTRYPOINT [ "sh", "-c", "npm run dev" ]