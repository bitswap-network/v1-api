import Pool from "../models/pool";
import { verifyAlchemySignature } from "../utils/functions";
import { processDeposit, syncWalletBalance } from "../helpers/pool";
import { AddressActivity } from "../interfaces/alchemy";
const webhookRouter = require("express").Router();

webhookRouter.post("/pool", async (req, res, next) => {
  console.log(req.body);
  if (verifyAlchemySignature(req)) {
    await syncWalletBalance();
    req.body.activity.forEach(async (activity: AddressActivity) => {
      const { toAddress, value, asset, hash } = activity;
      // If the transaction is successfully sent from the wallet
      // Mark the listing as completed
      // Transaction is sent to the wallet
      if (toAddress && value && hash && asset) {
        try {
          const pool = await Pool.findOne({
            address: toAddress.toLowerCase(),
          }).exec();

          if (pool) {
            // pool.balance += value;
            let txnHashList = pool.txnHashList ? pool.txnHashList : [];
            txnHashList.push(hash);
            pool.txnHashList = txnHashList;
            pool.save();
            if (pool.active) {
              processDeposit(pool, value, asset, hash);
              res.sendStatus(204);
            } else {
              console.log("sent to inactive pool");
              res.sendStatus(400);
            }
          } else {
            res.sendStatus(400);
          }
        } catch (e) {
          console.error(e);
          next(e);
        }
      }
    });
  } else {
    res.sendStatus(401);
  }
});

export default webhookRouter;
