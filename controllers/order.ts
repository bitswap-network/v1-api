import User from "../models/user";
import { tokenAuthenticator, limitOrderSchema, marketOrderSchema, marketQuantitySchema, marketPriceSchema } from "../utils/middleware";
import Order from "../models/order";
import { generateHMAC, orderBalanceValidate, userVerifyCheck } from "../utils/functions";
import * as config from "../config";
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
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  }
});

orderRouter.post("/limit", tokenAuthenticator, limitOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderPrice, orderSide } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "limit", orderSide, orderQuantity, orderPrice) && userVerifyCheck(user)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: +orderQuantity.toFixed(2),
      orderPrice: +orderPrice.toFixed(2),
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/limit`, JSON.stringify(body), {
        headers: { "Server-Signature": generateHMAC(body), "Content-Type": "application/json" },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

orderRouter.post("/market", tokenAuthenticator, marketOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderSide, orderSlippage, orderQuote } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "market", orderSide, orderQuantity) && userVerifyCheck(user)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: +orderQuantity.toFixed(2),
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/market/${orderQuote}/${orderSlippage}`, body, {
        headers: { "Server-Signature": generateHMAC(body) },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

orderRouter.get("/cancel/:id", tokenAuthenticator, async (req, res, next) => {
  if (!req.params.id) {
    next(createError(400, "Invalid Request."));
  } else {
    let body = {
      orderID: req.params.id,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/cancel`, body, {
        headers: { "Server-Signature": generateHMAC(body) },
      });
      res.status(response.status).send(response.data);
    } catch (e) {
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  }
});

orderRouter.post("/market-price", marketPriceSchema, async (req, res, next) => {
  const { orderQuantity, orderSide } = req.body;
  try {
    const response = await axios.get(`${config.EXCHANGE_API}/market-price/${orderSide}/${+orderQuantity.toFixed(2)}`);
    res.status(response.status).send(response.data);
  } catch (e) {
    if (e.response.data.error) {
      next(createError(e.response.status, e.response.data.error));
    } else {
      next(e);
    }
  }
});

orderRouter.post("/market-quantity", marketQuantitySchema, async (req, res, next) => {
  const { maxPrice, orderSide } = req.body;
  try {
    const response = await axios.get(`${config.EXCHANGE_API}/market-quantity/${orderSide}/${+maxPrice.toFixed(2)}`);
    res.status(response.status).send(response.data);
  } catch (e) {
    if (e.response.data.error) {
      next(createError(e.response.status, e.response.data.error));
    } else {
      next(e);
    }
  }
});

export default orderRouter;
