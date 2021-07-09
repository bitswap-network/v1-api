import User from "../models/user";
import { tokenAuthenticator, depositBitcloutSchema, valueSchema, withdrawEthSchema, fireEyeWall } from "../utils/middleware";
import Transaction from "../models/transaction";
import Pool from "../models/pool";
import {
  getGasEtherscan,
  toNanos,
  userVerifyCheck,
  generateHMAC,
  getEthUsd,
  getBitcloutUsd,
  enforceWithdrawLimit,
} from "../utils/functions";
import { getAndAssignPool, syncWalletBalance } from "../helpers/pool";
import { getNonce, checkEthAddr, sendEth } from "../helpers/web3";
import * as config from "../config";
import { preflightTransaction, submitTransaction, transferBitcloutBalance } from "../helpers/bitclout";
import { handleSign, decryptGCM } from "../helpers/crypto";

import axios from "axios";
import Wallet from "../models/wallet";
const createError = require("http-errors");
const gatewayRouter = require("express").Router();
import { toWei } from "../utils/functions";
/*
  tier0: $2000 aggregate withdraw lim
  tier1: no limits

*/

gatewayRouter.get("/deposit/cancel/:id", fireEyeWall, tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
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

gatewayRouter.post("/deposit/bitclout-preflight", fireEyeWall, tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
  if (user) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        const wallet = await Wallet.findOne({ user: user._id }).exec();
        if (wallet) {
          const preflight = await preflightTransaction({
            AmountNanos: toNanos(value),
            MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
            RecipientPublicKeyOrUsername: wallet?.keyInfo.bitclout.publicKeyBase58Check,
            SenderPublicKeyBase58Check: user.bitclout.publicKey,
          });

          res.send({ data: preflight.data });
        } else {
          res.send({ error: "an error occurred" });
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

gatewayRouter.post("/withdraw/bitclout-preflight", fireEyeWall, tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
  if (user) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        const wallet = await Wallet.findOne({ user: user._id }).exec();
        if (wallet) {
          const preflight = await preflightTransaction({
            AmountNanos: toNanos(value),
            MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
            RecipientPublicKeyOrUsername: user.bitclout.publicKey,
            SenderPublicKeyBase58Check: wallet?.keyInfo.bitclout.publicKeyBase58Check,
          });

          res.send({ data: preflight.data });
        } else {
          res.send({ error: "an error occurred" });
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

gatewayRouter.post("/deposit/bitclout", fireEyeWall, tokenAuthenticator, depositBitcloutSchema, async (req, res, next) => {
  const { transactionHex, transactionIDBase58Check, value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false });
  if (user && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        const reciept = await submitTransaction({
          TransactionHex: transactionHex,
        });
        const bitcloutUsd = await getBitcloutUsd();
        const valueTruncated = +(toNanos(value) / 1e9).toFixed(8);
        const txn = new Transaction({
          user: user._id,
          transactionType: "deposit",
          assetType: "BCLT",
          value: valueTruncated,
          usdValueAtTime: valueTruncated * bitcloutUsd,
          completed: true,
          created: new Date(),
          completionDate: new Date(),
          txnHash: transactionIDBase58Check,
          state: "done",
        });
        user.transactions.push(txn._id);
        user.balance.bitclout += valueTruncated;
        await user.save();
        await txn.save();
        const body = {
          publicKey: user.bitclout.publicKey,
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

gatewayRouter.get("/deposit/eth", fireEyeWall, tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
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
          const pool_address = await getAndAssignPool(user);
          const pool = await Pool.findOne({ address: pool_address }).exec();
          if (pool) {
            const txn = new Transaction({
              user: user._id,
              transactionType: "deposit",
              assetType: "ETH",
              poolAddress: pool.address,
              created: new Date(),
            });
            user.transactions.push(txn._id);
            user.save();
            txn.save();
            res.status(200).send({ data: { address: pool.address, transaction: txn } });
          } else {
            res.sendStatus(500);
          }
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

gatewayRouter.post("/withdraw/bitclout", fireEyeWall, tokenAuthenticator, valueSchema, async (req, res, next) => {
  const { value } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key, "balance.in_transaction": false }).exec();
  if (user && user.bitclout.publicKey) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      try {
        await User.updateOne({ "bitclout.publicKey": req.key }, { $set: { "balance.in_transaction": true } });
        const preflight = await preflightTransaction({
          AmountNanos: toNanos(value),
          MinFeeRateNanosPerKB: config.MinFeeRateNanosPerKB,
          RecipientPublicKeyOrUsername: user.bitclout.publicKey,
          SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
        });
        const valueDeductedNanos = toNanos(value) + config.GatewayFees.BITCLOUT;
        const bitcloutUsd = await getBitcloutUsd();
        // const totalAmount = value + preflight.data.FeeNanos / 1e9;
        const txn = new Transaction({
          user: user._id,
          transactionType: "withdraw",
          assetType: "BCLT",
          value: +value.toFixed(9),
          usdValueAtTime: bitcloutUsd * +value.toFixed(9),
          created: new Date(),
          txnHash: "",
          gasPrice: 0, //todo
        });
        if (user.balance.bitclout >= valueDeductedNanos) {
          if (await enforceWithdrawLimit(user, bitcloutUsd * +value.toFixed(9))) {
            submitTransaction({
              TransactionHex: handleSign(preflight.data.TransactionHex),
            })
              .then(async response => {
                user.balance.bitclout -= valueDeductedNanos;
                user.balance.in_transaction = false;
                user.transactions.push(txn._id);
                const body = {
                  publicKey: user.bitclout.publicKey,
                };
                await axios.post(`${config.EXCHANGE_API}/exchange/sanitize`, body, {
                  headers: { "Server-Signature": generateHMAC(body) },
                });
                txn.state = "done";
                txn.completed = true;
                txn.completionDate = new Date();
                await user.save();
                await txn.save();
                res.send({ data: txn });
              })
              .catch(async error => {
                user.balance.in_transaction = false;
                user.transactions.push(txn._id);
                txn.state = "failed";
                txn.error = error.response.data ? error.response.data : "Server Error";
                txn.completed = true;
                txn.completionDate = new Date();
                await user.save();
                await txn.save();
                res.status(500).send({ data: txn });
              });
          } else {
            next(createError(403, "Overflowing withdraw limit."));
          }
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

gatewayRouter.post("/withdraw/eth", fireEyeWall, tokenAuthenticator, withdrawEthSchema, async (req, res, next) => {
  const { value, withdrawAddress } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  const pool = await Pool.findOne({ balance: { $gt: value } }).exec();
  if (user && pool && user.bitclout.publicKey && !config.BLACKLISTED_ETH_ADDR.includes(withdrawAddress.toLowerCase())) {
    if (!userVerifyCheck(user)) {
      next(createError(401, "User not verified."));
    } else {
      if (user.balance.ether >= value && checkEthAddr(withdrawAddress)) {
        try {
          const gas = await getGasEtherscan(); // get gas
          const key = decryptGCM(pool.hashedKey, config.POOL_HASHKEY); // decrypt pool key
          const nonce = await getNonce(pool.address); // get nonce
          const ethUsdResp = await getEthUsd();
          if (await enforceWithdrawLimit(user, ethUsdResp * value)) {
            await User.updateOne(
              { "bitclout.publicKey": req.key },
              { $inc: { "balance.ether": -value }, $set: { "balance.in_transaction": true } }
            );
            const body = {
              publicKey: user.bitclout.publicKey,
            };
            await axios.post(`${config.EXCHANGE_API}/exchange/sanitize`, body, {
              headers: { "Server-Signature": generateHMAC(body) },
            });
            // push to new mongodb collection, with a send time generated based on transaction risk. More valuable txns = higher time.
            // we can have a gocron job searching for jobs and taking them out of the db queue
            // this allows us to manually verify high risk transactions, and let lower risked transactions go through with better ux
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
              usdValueAtTime: value * ethUsdResp,
              completionDate: new Date(),
            }); //create withdraw txn object
            await User.updateOne(
              { "bitclout.publicKey": req.key },
              { $set: { "balance.in_transaction": false }, $push: { transactions: txn._id } }
            );
            txn.save();
            syncWalletBalance();
            res.status(200).send({ data: txn });
          } else {
            next(createError(403, "Overflowing withdraw limit."));
          }
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
