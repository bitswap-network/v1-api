// Imports
import express from "express";
import cors from "cors";
import helmet from "helmet";
const mongoose = require("mongoose");
import morgan from "morgan";
// Routers
import userRouter from "./controllers/users";
import gatewayRouter from "./controllers/gateway";
import orderRouter from "./controllers/order";
import authRouter from "./controllers/auth";
import utilRouter from "./controllers/utility";
import webhookRouter from "./controllers/webhook";

// Middleware
import * as middleware from "./utils/middleware";
import * as logger from "./utils/logger";
import * as config from "./utils/config";

//Rollbar logging
// const Rollbar = require("rollbar")
// Rollbar.configure({ logLevel: "info" })
// const rollbar = new Rollbar({
//   accessToken: config.ROLLBAR,
//   captureUncaught: true,
//   captureUnhandledRejections: true,
// })

const app: express.Application = express();

mongoose
  .connect(config.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch(error => {
    logger.error("Error connecting to MongoDB:", error.message);
  });
app.use(morgan("combined"));
app.use(cors());
app.use(helmet());
app.use(express.json());
// app.use(rollbar.errorHandler())

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(`BitSwap API`);
});

app.use("/user", userRouter);
app.use("/gateway", gatewayRouter);
app.use("/order", orderRouter);
app.use("/auth", authRouter);
app.use("/utility", utilRouter);
app.use("/webhook", webhookRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
