// Imports
import express from "express";
import cors from "cors";
import helmet from "helmet";
const mongoose = require("mongoose");

// Routers
import userRouter from "./controllers/users";
import gatewayRouter from "./controllers/gateway";
import authRouter from "./controllers/auth";
import utilRouter from "./controllers/utility";
// import webhookRouter from "./controllers/webhook";

// Middleware
import * as middleware from "./utils/middleware";
import * as logger from "./utils/logger";
import * as config from "./utils/config";

const app: express.Application = express();

mongoose
  .connect(config.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(middleware.requestLogger);

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(`BitSwap API`);
});

app.use("/user", userRouter);
app.use("/gateway", gatewayRouter);
app.use("/auth", authRouter);
app.use("/utility", utilRouter);
// app.use("/webhook", webhookRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
