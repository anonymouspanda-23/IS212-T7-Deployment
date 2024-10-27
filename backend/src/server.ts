import http from "http";
import { initDB, startCronJob } from "./config";
import { Mailer } from "./config/mailer";
import { app } from "./index";

const PORT = process.env.PORT || 3001;
const mailer = Mailer.getInstance();

app.listen(PORT, () => {
  console.log(`🚀 Server listening on localhost:${PORT} 🚀`);
  initDB();
  startCronJob();
  mailer.getTransporter();
});

const server = http.createServer(app.callback());

export { server };
