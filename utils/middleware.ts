import Joi from "joi";
import * as config from "./config";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const createError = require("http-errors");
const ExpressBrute = require("express-brute");
const MongooseStore = require("express-brute-mongoose");
const BruteForceSchema = require("express-brute-mongoose/dist/schema");

const bruteforce_model = mongoose.model("bruteforce", new mongoose.Schema(BruteForceSchema));
const store = new MongooseStore(bruteforce_model);
export const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
});

export const depthSchema = (req, res, next) => {
  const schema = Joi.object({
    startAt: Joi.number().greater(0).required(),
    endAt: Joi.number().greater(0).required(),
  });
  validateRequest(req, next, schema);
};

export const valueSchema = (req, res, next) => {
  const schema = Joi.object({
    value: Joi.number().greater(0).required(),
  });
  validateRequest(req, next, schema);
};
export const withdrawEthSchema = (req, res, next) => {
  const schema = Joi.object({
    value: Joi.number().greater(0).required(),
    withdrawAddress: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

export const marketOrderSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().greater(0).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const limitOrderSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().greater(0).required(),
    orderPrice: Joi.number().greater(0).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const depositBitcloutSchema = (req, res, next) => {
  const schema = Joi.object({
    transactionHex: Joi.string().required(),
    transactionIDBase58Check: Joi.string().length(54).required(),
    value: Joi.number().greater(0).required(),
  });
  validateRequest(req, next, schema);
};

export const updateProfileSchema = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email(),
    name: Joi.string().allow(""),
  });
  validateRequest(req, next, schema);
};

export const registerSchema = (req, res, next) => {
  const schema = Joi.object({
    publicKey: Joi.string().length(55).required(),
    email: Joi.string().email(),
    name: Joi.string(),
  });
  validateRequest(req, next, schema);
};

export const loginSchema = (req, res, next) => {
  const schema = Joi.object({
    publicKey: Joi.string().length(55).required(),
    identityJWT: Joi.string(),
  });
  validateRequest(req, next, schema);
};

export const fetchProfileSchema = (req, res, next) => {
  const schema = Joi.object({
    publicKey: Joi.string().length(55).required(),
    username: Joi.string().allow(""),
  });
  validateRequest(req, next, schema);
};

const validateRequest = (req, next, schema) => {
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    next(createError(400, `Validation Error: ${error.details.map(x => x.message).join(", ")}`));
  } else {
    req.body = value;
    next();
  }
};

export const requestLogger = (req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:  ", req.path);
  console.log("Header:  ", req.header);
  if (req.path === "/auth/login" || req.path === "/auth/register") {
    console.log("Body Filtered");
  } else {
    console.log("Body:  ", req.body);
  }
  console.log("---");
  next();
};

export const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    next(error);
  }
  res.status(error.status || 500);
  res.json({
    status: error.status,
    message: error.message,
    // stack: error.stack,
  });
};

export const tokenAuthenticator = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (token == null) return res.status(400).send("Missing token");

  jwt.verify(token, config.SECRET, (err, key) => {
    if (err) return res.status(403).send("Invalid token");

    req.key = key.PublicKeyBase58Check;

    next();
  });
};
