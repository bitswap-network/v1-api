import { getGasEtherscan, getEthUsd, getOrderbookState } from "../utils/functions";
import { getExchangeRate } from "../helpers/bitclout";
import Depth, { depthDoc } from "../models/depth";
import Order from "../models/order";
//TODO CLEANUP
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
      orderQuantityProcessed: { $gt: 0 },
    })
      .sort({ completeTime: "desc" })
      .exec();
    if (orders.length > 0) {
      const finalArr: { timestamp: Date; price: number }[] = [];
      let dateString1 = orders[0].completeTime
        ? `${orders[0].completeTime.getUTCFullYear()}-${orders[0].completeTime.getUTCMonth()}-${orders[0].completeTime.getUTCDate()}`
        : `${orders[0].created.getUTCFullYear()}-${orders[0].created.getUTCMonth()}-${orders[0].created.getUTCDate()}`;
      let dateString2 = "";
      let priceQuantitySum =
        (orders[0].execPrice ? orders[0].execPrice : orders[0].orderPrice) *
        (orders[0].orderQuantityProcessed ? orders[0].orderQuantityProcessed : orders[0].orderQuantity);
      let quantSum = orders[0].orderQuantityProcessed ? orders[0].orderQuantityProcessed : orders[0].orderQuantity;
      for (let i = 1; i < orders.length; ++i) {
        if (orders[i]) {
          const orderPriceQuantity =
            (orders[i].execPrice ? orders[i].execPrice! : orders[i].orderPrice) *
            (orders[i].orderQuantityProcessed ? orders[i].orderQuantityProcessed : orders[i].orderQuantity);
          const orderQuantity = orders[i].orderQuantityProcessed ? orders[i].orderQuantityProcessed : orders[i].orderQuantity;

          dateString2 = orders[i].completeTime
            ? `${orders[i].completeTime!.getUTCFullYear()}-${orders[i].completeTime!.getUTCMonth()}-${orders[i].completeTime!.getUTCDate()}`
            : `${orders[i].created.getUTCFullYear()}-${orders[i].created.getUTCMonth()}-${orders[i].created.getUTCDate()}`;
          if (dateString1 === dateString2 && orderQuantity && orderPriceQuantity && priceQuantitySum && quantSum) {
            priceQuantitySum += orderPriceQuantity;
            quantSum += orderQuantity;
          } else if (orderQuantity && orderPriceQuantity && priceQuantitySum && quantSum) {
            finalArr.push({
              timestamp: new Date(dateString1),
              price: Math.round((priceQuantitySum / quantSum + Number.EPSILON) * 100) / 100,
            });

            priceQuantitySum = orderPriceQuantity;
            quantSum = orderQuantity;
          }
          dateString1 = dateString2;
        }
      }
      finalArr.push({ timestamp: new Date(dateString1), price: Math.round((priceQuantitySum / quantSum + Number.EPSILON) * 100) / 100 });
      res.json(finalArr);
    } else {
      res.json([]);
    }
  } catch (e) {
    next(e);
  }
});

// utilRouter.get("/total-balances", async (req, res, next) => {
//   try {
//     const users = await User.find().exec();
//     const balances = {
//       ether: 0,
//       bitclout: 0,
//     };
//     users.forEach(user => {
//       balances.ether += user.balance.ether;
//       balances.bitclout += user.balance.bitclout;
//     });
//     res.json(balances);
//   } catch (e) {
//     next(e);
//   }
// });

export default utilRouter;
