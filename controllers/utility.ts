import { getGasEtherscan, getEthUsd } from "../utils/functions";
import { getExchangeRate } from "../helpers/bitclout";
import Depth, { depthDoc } from "../models/depth";

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
    console.log(response);
    const bitcloutPerUSD =
      1e9 / ((1e9 / response.data.SatoshisPerBitCloutExchangeRate / (response.data.USDCentsPerBitcoinExchangeRate / 100)) * 1e8);
    res.json({ data: bitcloutPerUSD });
  } catch (e) {
    next(e);
  }
});

// utilRouter.post("/depth", depthSchema, async (req, res, next) => {
//   //startAt, endAt should be relative to the number of milliseconds elapsed since January 1, 1970 00:00
//   const { startAt, endAt } = req.body;
//   const startDate = new Date(startAt);
//   const endDate = new Date(endAt);
//   try {
//     const depths = await Depth.find({
//       timestamp: {
//         $gte: startDate,
//         $lt: endDate,
//       },
//     })
//       .sort({ timestamp: "desc" })
//       .exec();
//     res.json({ data: depths });
//   } catch (e) {
//     next(e);
//   }
// });

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

export default utilRouter;
