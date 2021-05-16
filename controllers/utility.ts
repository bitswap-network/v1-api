import { getGasEtherscan, getEthUsd } from "../utils/functions";

const utilRouter = require("express").Router();

utilRouter.get("/eth-gasprice", async (req, res) => {
  try {
    const response = await getGasEtherscan();
    if (response.status === 200) {
      res.send(response.data.result);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

utilRouter.get("/eth-usd", async (req, res) => {
  try {
    const response = await getEthUsd();
    if (response.status === 200) {
      res.send(response.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

export default utilRouter;
