import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as middleware from "./utils/middleware";
import userRouter from "./controllers/users";
import listingRouter from "./controllers/listings";
import authRouter from "./controllers/auth";
import webhookRouter from "./controllers/webhook";
const logger = require("./utils/logger");
const mongoose = require("mongoose");
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
app.use(helmet()); //security
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.errorHandler);

// API Routes Here
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(`BitSwap API`);
});

app.use("/user", userRouter);
app.use("/listing", listingRouter);
app.use("/auth", authRouter);
app.use("/webhook", webhookRouter);
//unknown endpoint handler
// app.use((req, res, next) => {
//   res.status(404).send({ message: "unknown endpoint" });
// });
export default app;
