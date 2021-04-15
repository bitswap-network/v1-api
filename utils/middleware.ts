const logger = require("./logger");
const jwt = require("jsonwebtoken");

export const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
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

  jwt.verify(token, process.env.secret, (err, user) => {
    console.log(err);

    if (err) return response.status(403).send("Invalid token");

    request.user = user;

    next();
  });
};