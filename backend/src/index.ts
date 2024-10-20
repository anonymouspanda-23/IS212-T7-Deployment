import dotenv from "dotenv";
dotenv.config();

import cors from "@koa/cors";
import Koa from "koa";
import parser from "koa-bodyparser";
import router from "@/router";
import "reflect-metadata";

const app = new Koa();

app.use(cors());
app.use(parser());
app.use(router.routes());

export { app };
