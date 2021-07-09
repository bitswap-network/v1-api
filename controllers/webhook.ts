import Pool from "../models/pool";
import User from "../models/user";
import { verifyAlchemySignature, verifyPersonaSignature } from "../utils/functions";
import { processDeposit, syncWalletBalance } from "../helpers/pool";
import { AddressActivity } from "../interfaces/alchemy";
const webhookRouter = require("express").Router();

webhookRouter.post("/inquiry", async (req, res, next) => {
  if (verifyPersonaSignature(req)) {
    try {
      const inquiryState = req.body.data.attributes.payload.data.attributes.status;
      const accountId = req.body.data.attributes.payload.data.relationships?.account?.data.id;
      if (accountId) {
        const user = await User.findOne({ "verification.personaAccountId": accountId }).exec();
        if (user && inquiryState == "completed") {
          user.verification.personaVerified = true;
          if (user.tier === 0) {
            user.tier = 1;
          }
          await user.save();
        }
      }
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(401);
  }
});

webhookRouter.post("/pool", async (req, res, next) => {
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
            let txnHashList = pool.txnHashList ? pool.txnHashList : [];
            txnHashList.push(hash);
            pool.txnHashList = txnHashList;
            pool.save();
            if (pool.active) {
              processDeposit(pool, value, asset, hash);
              res.sendStatus(200);
            } else {
              res.sendStatus(200);
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
