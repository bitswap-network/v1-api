import User from "../models/user";
import { tokenAuthenticator, depositBitcloutSchema, limitOrderSchema, marketOrderSchema } from "../utils/middleware";
import Transaction from "../models/transaction";
import Pool from "../models/pool";
import { getGasEtherscan, generateHMAC, toNanos, orderBalanceValidate } from "../utils/functions";
import { getAndAssignPool, decryptAddress } from "../helpers/pool";
import { getNonce, checkEthAddr, sendEth } from "../helpers/web3";
import * as config from "../utils/config";
import { preflightTransaction, submitTransaction } from "../helpers/bitclout";
import { handleSign } from "../helpers/identity";

import axios from "axios";
const createError = require("http-errors");
const gatewayRouter = require("express").Router();

gatewayRouter.get("/deposit/cancel/:id", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //implement find transaction logic later
  if (user && req.params.id) {
    const transaction = await Transaction.findById(req.params.id).exec();
    const pool = await Pool.findOne({ user: user._id }).exec();
    if (pool && transaction) {
      try {
        pool.active = false;
        pool.activeStart = null;
        pool.user = null;
        transaction!.completed = true;
        transaction!.completionDate = new Date();
        transaction!.state = "failed";
        transaction!.error = "Deposit Cancelled";
        await transaction.save();
        await pool.save();
        res.sendStatus(200);
      } catch (e) {
        next(e);
      }
    } else {
      next(createError(406, "Unable to find transaction by id."));
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/deposit/bitclout-preflight", tokenAuthenticator, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user) {
    if (user.verification.status !== "verified") {
      next(createError(401, "User not verified."));
    } else {
      if (!isNaN(value)) {
        try {
          const preflight = await preflightTransaction({
            AmountNanos: toNanos(value),
            MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
            RecipientPublicKeyOrUsername: config.PUBLIC_KEY_BITCLOUT,
            SenderPublicKeyBase58Check: user.bitclout.publicKey,
          });

          res.send({ data: preflight.data });
        } catch (e) {
          if (e.response.data.error) {
            next(createError(e.response.status, e.response.data.error));
          } else {
            next(e);
          }
        }
      } else {
        next(createError(400, "Invalid Request."));
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/deposit/bitclout", tokenAuthenticator, depositBitcloutSchema, async (req, res, next) => {
  const { transactionHex, transactionIDBase58Check, value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      next(createError(401, "User not verified."));
    } else {
      try {
        await submitTransaction({
          TransactionHex: transactionHex,
        });
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
        res.send({ data: txn });
      } catch (e) {
        if (e.response.data.error) {
          next(createError(e.response.status, e.response.data.error));
        } else {
          next(e);
        }
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/deposit/eth", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      next(createError(401, "User not verified."));
    } else {
      const depositCheck = await Transaction.findOne({
        user: user._id,
        transactionType: "deposit",
        assetType: "ETH",
        completed: false,
      }).exec();
      if (!depositCheck) {
        try {
          const poolAddr = await getAndAssignPool(user._id.toString());
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "ETH",
          });
          user.transactions.push(txn._id);
          await user.save();
          await txn.save();
          res.status(200).send({ data: { address: poolAddr } });
        } catch (e) {
          next(e);
        }
      } else {
        next(createError(409, "Deposit already ongoing."));
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/withdraw/bitclout", tokenAuthenticator, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      next(createError(401, "User not verified."));
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
          res.send({ data: txn });
        } catch (e) {
          if (e.response.data.error) {
            next(createError(e.response.status, e.response.data.error));
          } else {
            next(e);
          }
        }
      } else {
        next(createError(409, "Insufficient funds."));
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/withdraw/eth", tokenAuthenticator, async (req, res, next) => {
  const { value, withdrawAddress } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  const pool = await Pool.findOne({ balance: { $gt: value } }).exec();
  if (user && pool && user.bitclout.publicKey) {
    if (user.verification.status !== "verified") {
      next(createError(401, "User not verified."));
    } else {
      if (!isNaN(value) && user.balance.ether >= value && checkEthAddr(withdrawAddress)) {
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
          res.status(200).send({ data: txn });
        } catch (e) {
          next(e);
        }
      } else {
        next(createError(409, "Insufficient funds."));
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/limit", tokenAuthenticator, limitOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderPrice, orderSide } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "limit", orderSide, orderQuantity, orderPrice)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: orderQuantity,
      orderPrice: orderPrice,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/limit`, body, {
        headers: { "server-signature": generateHMAC(body) },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      next(e);
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/market", tokenAuthenticator, marketOrderSchema, async (req, res, next) => {
  const { orderQuantity, orderSide } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //add verification to check user's balance
  if (user && orderBalanceValidate(user, "market", orderSide, orderQuantity)) {
    let body = {
      username: user.bitclout.publicKey,
      orderSide: orderSide,
      orderQuantity: orderQuantity,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/market`, body, {
        headers: { "server-signature": generateHMAC(body) },
      });
      res.status(response.status).send({ data: response.data });
    } catch (e) {
      next(e);
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/cancel", tokenAuthenticator, async (req, res, next) => {
  const { orderID } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  //add verification to check user's balance
  if (user) {
    let body = {
      orderID: orderID,
    };
    try {
      const response = await axios.post(`${config.EXCHANGE_API}/exchange/cancel`, body, {
        headers: { "server-signature": generateHMAC(body) },
      });
      res.status(response.status).send(response.data);
    } catch (e) {
      next(e);
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

export default gatewayRouter;
