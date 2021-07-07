import axios from "axios";
import Joi from "joi";
import * as config from "../config";
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

export const valueSchema = (req, res, next) => {
  const schema = Joi.object({
    value: Joi.number().greater(0).max(500).required(),
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

export const marketQuantitySchema = (req, res, next) => {
  const schema = Joi.object({
    maxPrice: Joi.number().min(0).max(10000000).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const marketPriceSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().min(0).max(10000000).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const marketOrderSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().min(0.01).max(500).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const limitOrderSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().min(0.01).max(500).required(),
    orderPrice: Joi.number().min(1).max(10000).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const depositBitcloutSchema = (req, res, next) => {
  const schema = Joi.object({
    transactionHex: Joi.string().required(),
    transactionIDBase58Check: Joi.string().length(54).required(),
    value: Joi.number().greater(0).max(500).required(),
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
    next(createError(400, `Validation Error`));
  } else {
    req.body = value;
    next();
  }
};

const excludeLogPaths = ["/utility/orderbook", "/user/data", "/order/market-price", "/user/orders"];

export const requestLogger = (req, res, next) => {
  if (excludeLogPaths.includes(req.path)) {
    console.log("Path:  ", req.path);
    console.log("---");
  } else {
    console.log("Method:", req.method);
    console.log("Path:  ", req.path);
    console.log("Header:  ", req.header);
    console.log("Body:  ", req.body);
    console.log("---");
  }
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
  });
};

export const tokenAuthenticator = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (token == null) return res.status(400).send("Missing token");

  jwt.verify(token, config.JWT_KEY, (err, key) => {
    if (err) return res.status(403).send("Invalid token");

    req.key = key.PublicKeyBase58Check;

    next();
  });
};

export const fireEyeWall = (req, res, next) => {
  axios
    .get(`${config.EXCHANGE_API}/fireeye-state`)
    .then(response => {
      if (response.data.Code === 0) {
        next();
      } else if (response.data.Code > 0 && response.data.Code < 20) {
        console.log("FireEye State: ", response.data);
        next();
      } else {
        return res.status(503).send("FireEye Blocked.");
      }
    })
    .catch(error => {
      console.error(error);
      return res.status(500).send("FireEye Error.");
    });
};
