import { getGasEtherscan, getEthUsd, getOrderbookState, getBitcloutUsd } from "../utils/functions";
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
    res.json({ data: response });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/bitclout-usd", async (req, res, next) => {
  try {
    const bitcloutUsd = await getBitcloutUsd();
    res.json({ data: +bitcloutUsd.toFixed(2) });
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
      orderPrice: { $gt: 100 },
      orderQuantityProcessed: { $gt: 0 },
    })
      .sort({ completeTime: "desc" })
      .exec();
    if (orders.length > 0) {
      const finalArr: { timestamp: Date; price: number }[] = [];
      let dateString1 = orders[0].completeTime
        ? `${orders[0].completeTime.getUTCFullYear()}-${orders[0].completeTime.getUTCMonth() + 1}-${orders[0].completeTime.getUTCDate()}`
        : `${orders[0].created.getUTCFullYear()}-${orders[0].created.getUTCMonth() + 1}-${orders[0].created.getUTCDate()}`;
      let dateString2 = "";
      let priceQuantitySum =
        orders[0].orderPrice * (orders[0].orderQuantityProcessed ? orders[0].orderQuantityProcessed : orders[0].orderQuantity);
      let quantSum = orders[0].orderQuantityProcessed ? orders[0].orderQuantityProcessed : orders[0].orderQuantity;
      for (let i = 1; i < orders.length; ++i) {
        if (orders[i]) {
          const orderPriceQuantity =
            orders[i].orderPrice * (orders[i].orderQuantityProcessed ? orders[i].orderQuantityProcessed : orders[i].orderQuantity);
          const orderQuantity = orders[i].orderQuantityProcessed ? orders[i].orderQuantityProcessed : orders[i].orderQuantity;

          dateString2 = orders[i].completeTime
            ? `${orders[i].completeTime!.getUTCFullYear()}-${orders[i].completeTime!.getUTCMonth() + 1}-${orders[
                i
              ].completeTime!.getUTCDate()}`
            : `${orders[i].created.getUTCFullYear()}-${orders[i].created.getUTCMonth() + 1}-${orders[i].created.getUTCDate()}`;
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

export default utilRouter;
