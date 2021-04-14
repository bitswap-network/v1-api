import express from "express";
import * as http from "http";
const cors = require("cors");
import * as middleware from "./utils/middleware";
const logger = require("./utils/logger");
import { RoutesConfig } from "./routes/routes.config";
import { Routes } from "./routes/routes";
const app: express.Application = express();
const server: http.Server = http.createServer(app);
const PORT = process.env.PORT ? process.env.PORT : 5000;
const routes: Array<RoutesConfig> = [];
// const TIMEOUT: number = process.env.TIMEOUT ? process.env.TIMEOUT : 100000;
app.use(express.json());
app.use(cors());
app.use(middleware.requestLogger);
routes.push(new Routes(app));

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(`Server up and running!`);
});
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});
io.use((socket, next) => {
  const usertoken = socket.handshake.auth.usertoken;

  const tokenresp = middleware.tokenAuthenticatorIO(usertoken);
  if (tokenresp) {
    socket.usertoken = usertoken;
    socket.username = tokenresp.username;
    next();
  } else {
    console.log("error connecting socket");
    return next(new Error("invalid token"));
  }
});
io.on("connection", (socket) => {
  socket.emit("usertoken", socket.usertoken);
});
app.set("socketio", io);
server.listen(PORT, () => {
  logger.info(`Server1 listening on port ${PORT}`);
  routes.forEach((route: RoutesConfig) => {
    logger.info(`Routes configured`);
  });
});
// server.timeout = 300000;
