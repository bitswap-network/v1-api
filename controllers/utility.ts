import { bruteforce, tokenAuthenticator } from "../utils/middleware";
import axios from "axios";
import * as config from "../utils/config";

const utilRouter = require("express").Router();

utilRouter.get("/getGas", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${config.ETHERSCAN_KEY}`
    );
    if (response.status === 200) {
      res.send(response.data.result);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

utilRouter.get("/getEthUSD", async (req, res) => {
  try {
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`,
      {
        headers: { Authorization: `Apikey ${config.CRYPTOCOMPARE_KEY}` },
      }
    );
    if (response.status === 200) {
      res.send(response.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

export default utilRouter;
