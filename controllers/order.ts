import User from "../models/user";
import { tokenAuthenticator, limitOrderSchema, marketOrderSchema } from "../utils/middleware";
import Order from "../models/order";
import { generateHMAC, orderBalanceValidate, userVerifyCheck } from "../utils/functions";
import * as config from "../utils/config";
import axios from "axios";

const createError = require("http-errors");
const orderRouter = require("express").Router();

orderRouter.get("/:id", tokenAuthenticator, async (req, res, next) => {
  if (!req.params.id) {
    next(createError(400, "Invalid Request."));
  } else {
    try {
      const order = await Order.findOne({ orderID: req.params.id }).exec();
      res.json({ data: order });
    } catch (e) {
      next(e);
    }
  }
});

orderRouter.post("/limit", tokenAuthenticator, limitOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderPrice, orderSide } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "limit", orderSide, orderQuantity, orderPrice) && userVerifyCheck(user)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: orderQuantity,
      orderPrice: orderPrice,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/limit`, body, {
        headers: { "server-signature": generateHMAC(body) },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      next(e);
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

orderRouter.post("/market", tokenAuthenticator, marketOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderSide } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "market", orderSide, orderQuantity) && userVerifyCheck(user)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: orderQuantity,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/market`, body, {
        headers: { "server-signature": generateHMAC(body) },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      next(e);
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

orderRouter.get("/cancel/:id", tokenAuthenticator, async (req, res, next) => {
  if (!req.params.id) {
    next(createError(400, "Invalid Request."));
  } else {
    const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
    if (user) {
      let body = {
        orderID: req.params.id,
      };
      try {
        const response = await axios.post(`${config.EXCHANGE_API}/exchange/cancel`, body, {
          headers: { "server-signature": generateHMAC(body) },
        });
        res.status(response.status).send(response.data);
      } catch (e) {
        next(e);
      }
    } else {
      next(createError(400, "Invalid Request."));
    }
  }
});

orderRouter.post("/market-price", tokenAuthenticator, marketOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderSide } = req.body;
  try {
    const response = await axios.get(`${config.EXCHANGE_API}/market-price/cancel/${orderSide}/${orderQuantity}`);
    res.status(response.status).send(response.data);
  } catch (e) {
    next(e);
  }
});

export default orderRouter;
