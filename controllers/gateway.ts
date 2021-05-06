import User from "../models/user";
import { tokenAuthenticator } from "../utils/middleware";
import Transaction from "../models/transaction";
import Pool from "../models/pool";
import { getGasEtherscan } from "../utils/functions";
import { sendAndSubmitBitclout, sendEth } from "../utils/fulfiller";
import { getAndAssignPool, decryptAddress } from "../helpers/pool";
import { getNonce } from "../helpers/web3";
const gatewayRouter = require("express").Router();

gatewayRouter.post("/deposit", tokenAuthenticator, async (req, res) => {
  const { bclt_nanos, assetType } = req.body;
  const user = await User.findOne({ username: req.user.username })
    .populate("transactions")
    .exec(); //use populated transaction tree to check if an ongoing deposit is occuring
  const poolCheck = await Pool.findOne({
    user: user?._id,
  }).exec();
  if (user && user.verification.status === "verified" && !poolCheck) {
    switch (assetType) {
      case "ETH":
        try {
          const pool_id = await getAndAssignPool(user._id.toString());
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "ETH",
            pool: pool_id,
          });
          user.transactions.push(txn._id);
          await user.save();
          await txn.save();
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
      case "BCLT":
        try {
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "BCLT",
            value: parseInt(bclt_nanos),
          });
          user.transactions.push(txn._id);
          await user.save();
          await txn.save();
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
    }
  } else {
    res.status(400).send("user not found");
  }
});

gatewayRouter.post("/withdraw", tokenAuthenticator, async (req, res) => {
  const { value, assetType, withdrawAddress } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  let pool = await Pool.findOne({ balance: { $gt: value } }).exec();
  //should validate gas price on front end
  if (user && user.verification.status === "verified") {
    switch (assetType) {
      case "ETH":
        if (user.balance >= value && pool) {
          try {
            let gas = await getGasEtherscan(); // get gas
            let key = decryptAddress(pool.privateKey); // decrypt pool key
            let nonce = await getNonce(pool.address); // get nonce

            user.balance.ether -= value; //deduct balance
            const receipt = await sendEth(
              key,
              pool.address,
              withdrawAddress,
              value,
              nonce,
              parseInt(gas.data.result.FastGasPrice.toString())
            ); // receipt object: https://web3js.readthedocs.io/en/v1.3.4/web3-eth.html#eth-gettransactionreceipt-return
            const txn = new Transaction({
              user: user._id,
              transactionType: "withdraw",
              assetType: "ETH",
              completed: true, //set completed to true after transaction goes through?
              txnHash: receipt.transactionHash,
              gasDeducted:
                parseInt(gas.data.result.FastGasPrice.toString()) / 1e9,
            }); //create withdraw txn object
            user.transactions.push(txn._id); // push txn
            await user.save();
            await txn.save();
            res.sendStatus(200);
          } catch (e) {
            res.status(500).send(e);
          }
        } else {
          res.status(409).send("insufficient balance");
        }

      case "BCLT":
        try {
          const txnHash = await sendAndSubmitBitclout(
            user.bitclout.publicKey,
            value
          );
          const txn = new Transaction({
            user: user._id,
            transactionType: "withdraw",
            assetType: "BCLT",
            completed: true,
            value: parseInt(value),
            txnHash: txnHash,
          });
          user.transactions.push(txn._id);
          await user.save();
          await txn.save();
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
    }
  } else {
    res.status(400).send("user not found");
  }
});

export default gatewayRouter;
