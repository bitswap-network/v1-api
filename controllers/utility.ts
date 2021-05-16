import { tokenAuthenticator } from "../utils/middleware";
import { genString } from "../utils/functions";
import { completeEmail } from "../utils/mailBody";
import User from "../models/user";
import Transaction from "../models/transaction";
import sendMail from "../utils/mailer";
import { getGasEtherscan, getEthUsdCC, generateHMAC } from "../utils/functions";

const utilRouter = require("express").Router();

utilRouter.get("/getGas", async (req, res) => {
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

utilRouter.get("/pendingtxns", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    if (user.admin) {
      const Txns = await Transaction.find({ status: "pending" }).exec();
      if (Txns) {
        res.status(200).send(Txns);
      } else {
        res.status(500).send("error getting txns");
      }
    } else {
      res.status(403).send("user not admin");
    }
  } else {
    res.status(400).send("user not found");
  }
});

utilRouter.get("/getEthUSD", async (req, res) => {
  try {
    const response = await getEthUsdCC();
    if (response.status === 200) {
      res.send(response.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

export default utilRouter;
