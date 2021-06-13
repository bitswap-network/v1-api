import Joi from "joi";
import * as config from "./config";
import User from "../models/user";
import * as logger from "./logger";
import { getUserStatelessInfo } from "../helpers/bitclout";
import Order from "../models/order";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const createError = require("http-errors");
// const ExpressBrute = require("express-brute");
// const MongooseStore = require("express-brute-mongoose");
// const BruteForceSchema = require("express-brute-mongoose/dist/schema");

// const bruteforce_model = mongoose.model("bruteforce", new mongoose.Schema(BruteForceSchema));
// const store = new MongooseStore(bruteforce_model);
// export const bruteforce = new ExpressBrute(store, {
//   freeRetries: 5,
// });

export const valueSchema = (req, res, next) => {
  const schema = Joi.object({
    value: Joi.number().greater(0).less(500).required(),
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
    orderQuantity: Joi.number().greater(0).less(500).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const limitOrderSchema = (req, res, next) => {
  const schema = Joi.object({
    orderQuantity: Joi.number().greater(0).less(500).required(),
    orderPrice: Joi.number().greater(100).less(500).required(),
    orderSide: Joi.string().valid("buy", "sell").required(),
  });
  validateRequest(req, next, schema);
};

export const depositBitcloutSchema = (req, res, next) => {
  const schema = Joi.object({
    transactionHex: Joi.string().required(),
    transactionIDBase58Check: Joi.string().length(54).required(),
    value: Joi.number().greater(0).less(500).required(),
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
  });
};

const allowedIds = [
  "2adc3c27-061d-4d58-a7f4-0b25a84947cb", //hugh
];

export const tokenAuthenticator = (req, res, next) => {
  if (req.headers["x-api-token"]) {
    if (allowedIds.includes(req.headers["x-api-token"])) {
      next();
    } else {
      return res.status(403).send("Invalid token");
    }
  } else {
    const token = req.headers["x-access-token"];

    if (token == null) return res.status(400).send("Missing token");

    jwt.verify(token, config.SECRET, (err, key) => {
      if (err) return res.status(403).send("Invalid token");

      req.key = key.PublicKeyBase58Check;

      next();
    });
  }
};

export const ValidateDBWithBitCloutWallet = async (req, res, next) => {
  logger.info("Attempting to Validate DB");
  //Get the default connection
  const db = mongoose.connection;
  // The MAXIMUM difference between the sum of bitclout balances in the database and our BitClout Wallet
  // This is 1e5 / 1e9 bitclout.
  const MaxToleranceBetweenDbAndWallet = 0.001;

  //Bind connection to error event (to get notification of connection errors)
  db.on(`error`, console.error.bind(console, `MongoDB connection error:`));
  let AdjustedUserBitCloutTotal = 0;
  // await User.find({}, (err, users) => {
  //   if (err) {
  //     logger.error(`Encountered an error when communicating with MongoDB`);
  //     return false;
  //   }
  //   const UserBitCloutTotal = users.reduce(
  //     // (runningtotal, userDoc) => (userDoc.bitclout.username !== "BitSwap" ? runningtotal + userDoc.balance.bitclout : runningtotal),
  //     (runningtotal, userDoc) => {
  //       console.log(runningtotal, userDoc.bitclout.username);
  //       return userDoc.bitclout.username != "BitSwap" ? runningtotal + userDoc.balance.bitclout : runningtotal;
  //     },
  //     0
  //   );
  //   logger.info("Total Bitclout balance: " + UserBitCloutTotal.toString());
  //   AdjustedUserBitCloutTotal = UserBitCloutTotal / 0.98;
  //   logger.info("Adjusted Total Bitclout balance: " + AdjustedUserBitCloutTotal.toString());
  // });
  await Order.find({}, (err, orders) => {
    if (err) {
      logger.error(`Encountered an error when communicating with MongoDB`);
      return false;
    }
    logger.info(orders);
    const totalQuantityProcessed = orders.reduce(
      // (runningtotal, userDoc) => (userDoc.bitclout.username !== "BitSwap" ? runningtotal + userDoc.balance.bitclout : runningtotal),
      (runningtotal, orderDoc) => {
        console.log(runningtotal, orderDoc.orderQuantityProcessed);
        // return userDoc.bitclout.username != "BitSwap" ? runningtotal + userDoc.balance.bitclout : runningtotal;
        return runningtotal + orderDoc.orderQuantityProcessed;
      },
      0
    );
    logger.info("Total Bitclout balance: " + totalQuantityProcessed.toString());
    AdjustedUserBitCloutTotal = totalQuantityProcessed;
  });
  // Get Current Wallet BitClout Balance
  const wallet = await getUserStatelessInfo(config.PUBLIC_KEY_BITCLOUT!);
  const walletBCLT = wallet.data.UserList.find(data => data.PublicKeyBase58Check === config.PUBLIC_KEY_BITCLOUT)!.BalanceNanos / 1e9;
  logger.info("Wallet BitClout: " + walletBCLT.toString());
  if (!wallet) {
    return res.status(500).send("Could not get Wallet");
  }
  // If the difference between the `AdjustedUserBitCloutTotal` and the Wallet
  // BitClout Balance is greater than the tolerance, there may be an exploit
  // in progress.
  if (Math.abs(AdjustedUserBitCloutTotal - walletBCLT) >= MaxToleranceBetweenDbAndWallet) {
    return res.status(500).send(`Database sum: ${AdjustedUserBitCloutTotal} and BitClout wallet: ${walletBCLT} differ by more than 1e-4.`);
  }
};
