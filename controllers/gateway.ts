import User from "../models/user";
import { tokenAuthenticator } from "../utils/middleware";
import Transaction from "../models/transaction";
import Pool from "../models/pool";
import { getGasEtherscan, generateHMAC, toNanos } from "../utils/functions";
import { sendEth } from "../utils/fulfiller";
import { getAndAssignPool, decryptAddress } from "../helpers/pool";
import { getNonce, checkEthAddr } from "../helpers/web3";
import * as config from "../utils/config";
import { preflightTransaction, submitTransaction } from "../helpers/bitclout";
import { handleSign } from "../helpers/identity";

import axios from "axios";
const gatewayRouter = require("express").Router();

gatewayRouter.post("/deposit/cancel", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("onGoingDeposit").exec();
  //implement find transaction logic later
  if (user?.onGoingDeposit) {
    const transaction = await Transaction.findById(user.onGoingDeposit._id);
    const pool = await Pool.findOne({ user: user._id }).exec();
    if (pool) {
      pool.active = false;
      pool.activeStart = null;
      pool.user = null;
      await pool.save();
    }
    if (transaction) {
      transaction!.completed = true;
      transaction!.completionDate = new Date();
      transaction!.state = "failed";
      transaction!.error = "Deposit Cancelled";
      await transaction.save();
    }
    user.onGoingDeposit = null;
    await user.save();
    res.sendStatus(200);
    //find transaction and set to failed
  } else {
    res.status(409).send("No deposit to cancel.");
  }
});

gatewayRouter.post("/deposit/bitclout-preflight", tokenAuthenticator, async (req, res) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      res.status(400).send("User not verified.");
    } else {
      if (isNaN(value)) {
        try {
          const preflight = await preflightTransaction({
            AmountNanos: toNanos(value),
            MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
            RecipientPublicKeyOrUsername: config.PUBLIC_KEY_BITCLOUT,
            SenderPublicKeyBase58Check: user.bitclout.publicKey,
          });
          if (preflight.data.error) {
            res.status(500).send(preflight.data);
          } else {
            res.send(preflight.data);
          }
        } catch (error) {
          console.log(error);
          res.status(error.response.status).send(error.response.data);
        }
      } else {
        res.status(400).send("invalid request");
      }
    }
  } else {
    res.status(400).send("User not found");
  }
});

gatewayRouter.post("/deposit/bitclout", tokenAuthenticator, async (req, res) => {
  const { transactionHex, transactionIDBase58Check, value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("transactions").exec(); //use populated transaction tree to check if an ongoing deposit is occuring
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      res.status(400).send("User not verified.");
    } else {
      if (isNaN(value) && transactionHex && transactionIDBase58Check) {
        try {
          const depositRes = await submitTransaction({
            TransactionHex: transactionHex,
          });
          if (depositRes.data.error) {
            res.status(500).send(depositRes.data);
          } else {
            const txn = new Transaction({
              user: user._id,
              transactionType: "deposit",
              assetType: "BCLT",
              value: value,
              completed: true,
              completionDate: new Date(),
              txnHash: transactionIDBase58Check,
            });
            user.transactions.push(txn._id);
            user.balance.bitclout += value;
            await user.save();
            await txn.save();
            res.send(txn);
          }
        } catch (error) {
          console.log(error);
          res.status(error.response.status).send(error.response.data);
        }
      } else {
        res.status(400).send("invalid request");
      }
    }
  } else {
    res.status(400).send("User not found");
  }
});

gatewayRouter.post("/deposit/eth", tokenAuthenticator, async (req, res) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("transactions").exec();
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      res.status(400).send("User not verified.");
    } else {
      if (isNaN(value)) {
        try {
          const poolAddr = await getAndAssignPool(user._id.toString());
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "ETH",
          });
          user.transactions.push(txn._id);
          user.onGoingDeposit = txn._id;
          await user.save();
          await txn.save();
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
      } else {
        res.status(400).send("invalid request");
      }
    }
  } else {
    res.status(400).send("User not found");
  }
});

gatewayRouter.post("/withdraw/bitclout", tokenAuthenticator, async (req, res) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("transactions").exec(); //use populated transaction tree to check if an ongoing deposit is occuring
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      res.status(400).send("User not verified.");
    } else {
      if (isNaN(value) && user.balance.bitclout >= value) {
        try {
          const preflight = await preflightTransaction({
            AmountNanos: toNanos(value),
            MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
            RecipientPublicKeyOrUsername: user.bitclout.publicKey,
            SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
          });
          const withdrawRes = await submitTransaction({
            TransactionHex: handleSign(preflight.data.TransactionHex),
          });
          if (withdrawRes.data.error) {
            res.status(500).send(withdrawRes.data);
          } else {
            const txn = new Transaction({
              user: user._id,
              transactionType: "withdraw",
              assetType: "BCLT",
              value: value,
              completed: true,
              completionDate: new Date(),
              txnHash: preflight.data.TransactionIDBase58Check,
            });
            user.transactions.push(txn._id);
            user.balance.bitclout -= value;
            await user.save();
            await txn.save();
            res.send(txn);
          }
        } catch (error) {
          console.log(error);
          res.status(error.response.status).send(error.response.data);
        }
      } else {
        res.status(409).send("insufficient funds");
      }
    }
  } else {
    res.status(400).send("User not found");
  }
});

gatewayRouter.post("/withdraw/eth", tokenAuthenticator, async (req, res) => {
  const { value, withdrawAddress } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("transactions").exec(); //use populated transaction tree to check if an ongoing deposit is occuring
  const pool = await Pool.findOne({ balance: { $gt: value } }).exec();
  if (user && pool && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      res.status(400).send("User not verified.");
    } else {
      if (isNaN(value) && user.balance.ether >= value && checkEthAddr(withdrawAddress)) {
        try {
          const gas = await getGasEtherscan(); // get gas
          const key = decryptAddress(pool.privateKey); // decrypt pool key
          const nonce = await getNonce(pool.address); // get nonce
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
            gasPrice: parseInt(gas.data.result.FastGasPrice.toString()),
          }); //create withdraw txn object
          user.balance.ether -= value;
          user.transactions.push(txn._id); // push txn
          await user.save();
          await txn.save();
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
      } else {
        res.status(409).send("insufficient funds");
      }
    }
  } else {
    res.status(400).send("User not found");
  }
});

gatewayRouter.post("/limit", tokenAuthenticator, async (req, res) => {
  const { orderQuantity, orderPrice, orderSide } = req.body();
  //add verification to check user's balance
  let body = {
    username: req.params.username,
    orderSide: orderSide,
    orderQuantity: orderQuantity,
    orderPrice: orderPrice,
  };
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/limit`, body, {
      headers: { "server-signature": generateHMAC(body) },
    });
    res.status(response.status).send(response.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

gatewayRouter.post("/market", tokenAuthenticator, async (req, res) => {
  const { orderQuantity, orderSide } = req.body();
  //add verification to check user's balance
  let body = {
    username: req.params.username,
    orderSide: orderSide,
    orderQuantity: orderQuantity,
  };
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/market`, body, {
      headers: { "server-signature": generateHMAC(body) },
    });
    res.status(response.status).send(response.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

gatewayRouter.post("/cancel", tokenAuthenticator, async (req, res) => {
  const { orderID } = req.body();
  //add verification to check user's balance
  let body = {
    orderID: orderID,
  };
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/cancel`, body, {
      headers: { "server-signature": generateHMAC(body) },
    });
    res.status(response.status).send(response.data);
  } catch (e) {
    res.status(500).send(e);
  }
});

export default gatewayRouter;
