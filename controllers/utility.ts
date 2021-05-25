import { getGasEtherscan, getEthUsd } from "../utils/functions";
import { getExchangeRate } from "../helpers/bitclout";
import Depth from "../models/depth";

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

utilRouter.get("/depth", async (req, res, next) => {
  try {
    const depths = await Depth.find({}).sort({ _id: -1 }).exec();
    res.json({ data: depths });
  } catch (e) {
    next(e);
  }
});

utilRouter.get("/depth-current", async (req, res, next) => {
  try {
    const depth = await Depth.findOne({}).sort({ _id: -1 }).exec();
    res.json({ data: depth });
  } catch (e) {
    next(e);
  }
});

export default utilRouter;
