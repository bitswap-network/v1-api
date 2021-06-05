import { getGasEtherscan, getEthUsd, getOrderbookState } from "../utils/functions";
import { getExchangeRate } from "../helpers/bitclout";
import Depth, { depthDoc } from "../models/depth";
import Order from "../models/order";
import User from "../models/user";

const utilRouter = require("express").Router();

utilRouter.get("/eth-gasprice", async (req, res, next) => {
  try {
    const response = await getGasEtherscan();
    res.json({ data: response.data.result });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/eth-usd", async (req, res, next) => {
  try {
    const response = await getEthUsd();
    res.json({ data: response.data.result });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/bitclout-usd", async (req, res, next) => {
  try {
    const response = await getExchangeRate();
    const bitcloutPerUSD =
      1e9 / ((1e9 / response.data.SatoshisPerBitCloutExchangeRate / (response.data.USDCentsPerBitcoinExchangeRate / 100)) * 1e8);
    res.json({ data: bitcloutPerUSD });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/depth", async (req, res, next) => {
  const dateRange = req.query.dateRange;

  switch (dateRange) {
    case "max": {
      const depths = await Depth.find().sort({ timestamp: "asc" }).exec();
      const step = Math.round(depths.length / 300);
      const depthArr: depthDoc[] = [];
      for (let i = depths.length - 1; i >= 0; i -= step) {
        depthArr.push(depths[i]);
      }
      res.json({ data: depthArr });
      break;
    }

    case "1m": {
      const now = new Date();
      now.setDate(now.getDate() - 30);
      const depths = await Depth.find({
        timestamp: {
          $gte: now,
        },
      })
        .sort({ timestamp: "asc" })
        .exec();
      const step = Math.round(depths.length / 300);
      const depthArr: depthDoc[] = [];
      for (let i = depths.length - 1; i >= 0; i -= step) {
        depthArr.push(depths[i]);
      }
      res.json({ data: depthArr });
      break;
    }

    case "1w": {
      const now = new Date();
      now.setDate(now.getDate() - 7);
      const depths = await Depth.find({
        timestamp: {
          $gte: now,
        },
      })
        .sort({ timestamp: "asc" })
        .exec();
      const step = Math.round(depths.length / 300);
      const depthArr: depthDoc[] = [];
      for (let i = depths.length - 1; i >= 0; i -= step) {
        depthArr.push(depths[i]);
      }
      res.json({ data: depthArr });
      break;
    }

    case "1d": {
      const now = new Date();
      now.setDate(now.getDate() - 1);
      const depths = await Depth.find({
        timestamp: {
          $gte: now,
        },
      })
        .sort({ timestamp: "asc" })
        .exec();
      res.json({ data: depths });
      break;
    }

    default: {
      res.status(400).send({ error: "Incorrect query" });
      break;
    }
  }
});

utilRouter.get("/depth-current", async (req, res, next) => {
  try {
    const depth = await Depth.findOne({}).sort({ timestamp: "desc" }).exec();
    res.json({ data: depth });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/orderbook", async (req, res, next) => {
  try {
    const response = await getOrderbookState();
    res.json(response.data);
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/order-history", async (req, res, next) => {
  try {
    const orders = await Order.find({
      complete: true,
      error: "",
      orderPrice: { $ne: undefined },
    })
      .sort({ completeTime: "desc" })
      .exec();
    const orderArr: { timestamp: Date; price: number }[] = [];
    orders.forEach(order => {
      orderArr.push({
        timestamp: order.completeTime!,
        price: order.orderPrice!,
      });
    });
    // loop through orderArr
    const finalArr: { timestamp: Date; price: number }[] = [];
    let dateString1 = `${orderArr[0].timestamp.getFullYear()}-${orderArr[0].timestamp.getMonth()}-${orderArr[0].timestamp.getDate()}`;
    let dateString2 = "";
    let sum = orderArr[0].price;
    let count = 1;
    // console.log(orderArr.length, dateString1);
    for (let i = 1; i < orderArr.length; ++i) {
      dateString2 = `${orderArr[i].timestamp.getFullYear()}-${orderArr[i].timestamp.getMonth()}-${orderArr[i].timestamp.getDate()}`;
      console.log(i, dateString1, dateString2, orderArr[i].price, sum, count);
      if (dateString1 === dateString2) {
        sum += orderArr[i].price;
        count++;
      } else {
        console.log({ timestamp: new Date(dateString1), price: sum / count });
        finalArr.push({ timestamp: new Date(dateString1), price: sum / count });
        sum = orderArr[i].price;
        count = 1;
      }
      dateString1 = dateString2;
    }
    console.log({ timestamp: new Date(dateString1), price: sum / count });
    finalArr.push({ timestamp: new Date(dateString1), price: Math.round((sum / count + Number.EPSILON) * 100) / 100 });
    res.json(finalArr);
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/total-balances", async (req, res, next) => {
  try {
    const users = await User.find().exec();
    const balances = {
      ether: 0,
      bitclout: 0,
    };
    users.forEach(user => {
      balances.ether += user.balance.ether;
      balances.bitclout += user.balance.bitclout;
    });
    res.json(balances);
  } catch (e) {
    next(e);
  }
});

export default utilRouter;
