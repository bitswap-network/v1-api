const logger = require("./logger");
const config = require("./config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ExpressBrute = require("express-brute");
const MongooseStore = require("express-brute-mongoose");
const BruteForceSchema = require("express-brute-mongoose/dist/schema");

const bruteforce_model = mongoose.model(
  "bruteforce",
  new mongoose.Schema(BruteForceSchema)
);
const store = new MongooseStore(bruteforce_model);
export const bruteforce = new ExpressBrute(store, {
  freeRetries: 5
});

export const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Header:  ", request.header);
  if (request.path === "/auth/login" || request.path === "/auth/register") {
    logger.info("Body Filtered");
  } else {
    logger.info("Body:  ", request.body);
  }
  logger.info("---");
  next();
};

export const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

export const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "CastError" && error.kind === "ObjectId") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

export const tokenAuthenticator = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return response.status(401).send("Missing token");

  jwt.verify(token, config.SECRET, (err, user) => {
    if (err) return response.status(403).send("Invalid token");

    request.user = user;

    next();
  });
};
