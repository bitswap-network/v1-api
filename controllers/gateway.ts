import User from "../models/user";
import { tokenAuthenticator, depositBitcloutSchema, valueSchema, withdrawEthSchema } from "../utils/middleware";
import Transaction from "../models/transaction";
import Pool from "../models/pool";
import { getGasEtherscan, toNanos, userVerifyCheck, generateHMAC } from "../utils/functions";
import { getAndAssignPool, decryptAddressGCM, syncWalletBalance } from "../helpers/pool";
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

gatewayRouter.post("/deposit/bitclout-preflight", tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
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
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/withdraw/bitclout-preflight", tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        const preflight = await preflightTransaction({
          AmountNanos: toNanos(value),
          MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
          RecipientPublicKeyOrUsername: user.bitclout.publicKey,
          SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
        });

        res.send({ data: preflight.data });
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

gatewayRouter.post("/deposit/bitclout", tokenAuthenticator, depositBitcloutSchema, async (req, res, next) => {
  const { transactionHex, transactionIDBase58Check, value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        await submitTransaction({
          TransactionHex: transactionHex,
        });
        const valueTruncated = +value.toFixed(8);
        const txn = new Transaction({
          user: user._id,
          transactionType: "deposit",
          assetType: "BCLT",
          value: valueTruncated,
          completed: true,
          completionDate: new Date(),
          txnHash: transactionIDBase58Check,
          state: "done",
        });
        user.transactions.push(txn._id);
        user.balance.bitclout += valueTruncated;
        await user.save();
        await txn.save();
        const body = {
          username: user.bitclout.username,
        };
        axios.post(`${config.EXCHANGE_API}/exchange/sanitize`, body, {
          headers: { "Server-Signature": generateHMAC(body) },
        });
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

gatewayRouter.get("/deposit/eth", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
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
          const pool = await getAndAssignPool(user);
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "ETH",
            created: new Date(),
          });
          user.transactions.push(txn._id);
          user.save();
          txn.save();
          res.status(200).send({ data: { address: pool.address, transaction: txn } });
        } catch (e) {
          next(e);
        }
      } else {
        const pool = await Pool.findOne({ user: user._id, active: true }).exec();
        if (pool) {
          res.status(200).send({ data: { address: pool.address, transaction: depositCheck } });
        } else {
          depositCheck.completed = true;
          depositCheck.completionDate = new Date();
          depositCheck.state = "failed";
          depositCheck.error = "Server Error";
          depositCheck.save();
          next(createError(500, "Malformed pool/transaction objects."));
        }
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

gatewayRouter.post("/withdraw/bitclout", tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        const preflight = await preflightTransaction({
          AmountNanos: toNanos(value),
          MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
          RecipientPublicKeyOrUsername: user.bitclout.publicKey,
          SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
        });
        const totalAmount = value + preflight.data.FeeNanos / 1e9;
        if (user.balance.bitclout >= totalAmount) {
          await User.updateOne(
            { "bitclout.publicKey": req.key },
            { $inc: { "balance.bitclout": -totalAmount }, $set: { "balance.in_transaction": true } }
          ).exec();
          const body = {
            username: user.bitclout.username,
          };
          await axios.post(`${config.EXCHANGE_API}/exchange/sanitize`, body, {
            headers: { "Server-Signature": generateHMAC(body) },
          });
          await submitTransaction({
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
            state: "done",
            gasPrice: preflight.data.FeeNanos / 1e9,
          });
          user.transactions.push(txn._id);
          user.save();
          txn.save();
          User.updateOne({ "bitclout.publicKey": req.key }, { $set: { "balance.in_transaction": false } }).exec();
          res.send({ data: txn });
        } else {
          next(createError(409, "Insufficient funds."));
        }
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

gatewayRouter.post("/withdraw/eth", tokenAuthenticator, withdrawEthSchema, async (req, res, next) => {
  const { value, withdrawAddress } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  const pool = await Pool.findOne({ balance: { $gt: value } }).exec();
  if (user && pool && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      if (user.balance.ether >= value && checkEthAddr(withdrawAddress)) {
        try {
          const gas = await getGasEtherscan(); // get gas
          const key = decryptAddressGCM(pool.hashedKey); // decrypt pool key
          const nonce = await getNonce(pool.address); // get nonce
          await User.updateOne(
            { "bitclout.publicKey": req.key },
            { $inc: { "balance.ether": -value }, $set: { "balance.in_transaction": true } }
          ).exec();
          const body = {
            username: user.bitclout.username,
          };
          await axios.post(`${config.EXCHANGE_API}/exchange/sanitize`, body, {
            headers: { "Server-Signature": generateHMAC(body) },
          });
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
            created: new Date(),
            transactionType: "withdraw",
            assetType: "ETH",
            completed: true, //set completed to true after transaction goes through?
            txnHash: receipt.transactionHash,
            gasPrice: parseInt(gas.data.result.FastGasPrice.toString()),
            state: "done",
            value: value,
          }); //create withdraw txn object
          user.transactions.push(txn._id); // push txn
          user.save();
          txn.save();
          User.updateOne({ "bitclout.publicKey": req.key }, { $set: { "balance.in_transaction": false } }).exec();
          syncWalletBalance();
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

export default gatewayRouter;
