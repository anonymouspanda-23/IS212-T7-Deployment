import dotenv from "dotenv";
dotenv.config();

import cors from "@koa/cors";
import Koa from "koa";
import parser from "koa-bodyparser";
import router from "@/router";
import "reflect-metadata";

const app = new Koa();

const corsOptions: { [key: string]:  cors.Options } = {
  development: {
    origin: "*"
  },
  production: {
    origin: "https://g5t7.vercel.app",
    credentials: true,
  },
};

app.use(cors(corsOptions[process.env.NODE_ENV || 'development']));
app.use(parser());
app.use(router.routes());

export { app };
