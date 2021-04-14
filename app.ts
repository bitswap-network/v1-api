const config = require("./utils/config");
const express = require("express");
const app = express();
const cors = require("cors");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");
import userRouter from "./controllers/users";
import listingRouter from "./controllers/listings";
import authRouter from "./controllers/auth";

mongoose
  .connect(config.MONGODB_URL, {
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
app.use(express.json());
app.use(middleware.requestLogger);

// API Routes Here
app.get("/", (req, res) => {
  res.status(200).send(`BitSwap API`);
});
app.use("/user", userRouter);
app.use("/listing", listingRouter);
app.use("/auth", authRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
