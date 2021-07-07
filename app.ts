// Imports
import express from "express";
import cors from "cors";
import helmet from "helmet";
const mongoose = require("mongoose");
import morgan from "morgan";
import morganBody from "morgan-body";
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
import * as config from "./config";

//Setups
import { syncWalletBalance } from "./helpers/pool";
import { generateUserBitcloutWallets } from "./helpers/wallet";

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
    syncWalletBalance().then(() => {
      logger.info("syncing wallet balances!");
    });
  })
  .catch(error => {
    logger.error("Error connecting to MongoDB:", error.message);
  });

app.use(cors());
app.options("*", cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
morganBody(app, {
  skip: (req, res) => res.statusCode < 400,
});

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
generateUserBitcloutWallets();
export default app;
