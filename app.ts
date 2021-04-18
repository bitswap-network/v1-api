// Imports
import express from "express";
import cors from "cors";
import helmet from "helmet";
const mongoose = require("mongoose");

// Routers
import userRouter from "./controllers/users";
import listingRouter from "./controllers/listings";
import authRouter from "./controllers/auth";
// import webhookRouter from "./controllers/webhook";

// Middleware
import * as middleware from "./utils/middleware";
const logger = require("./utils/logger");
const config = require("./utils/config");

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
app.use("/listing", listingRouter);
app.use("/auth", authRouter);
// app.use("/webhook", webhookRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
