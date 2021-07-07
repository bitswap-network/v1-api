import * as config from "../config";
import Pool, {poolDoc} from "../models/pool";
import User, {UserDoc} from "../models/user";
import {getEthBalance, getUSDCBalance, genWallet, addAddressWebhook} from "../helpers/web3";
import {getEthUsd} from "../utils/functions";
import Transaction from "../models/transaction";
import {encryptGCM} from "./crypto";
export const syncWalletBalance = async () => {
  const pools = await Pool.find({}).exec();
  pools.forEach(async pool => {
    try {
      const balance_eth = await getEthBalance(pool.address);
      const balance_usdc = await getUSDCBalance(pool.address)
      await Pool.findByIdAndUpdate(pool._id, {$set: {balance: {ETH: parseFloat(balance_eth), USDC: balance_usdc}}})
    } catch (e) {
      console.error(e);
    }
  });
};

export const processDeposit: (pool: poolDoc, value: number, asset: string, hash: string) => void = async function (
  pool: poolDoc,
  value: number,
  asset: string,
  hash: string
): Promise<void> {
  const user = await User.findById(pool.user).exec();
  if (pool && user) {
    let transaction;
    switch (asset) {
      case "ETH":
        transaction = await Transaction.findOne({
          user: user._id,
          assetType: "ETH",
          transactionType: "deposit",
          completed: false,
        }).exec();
        if (transaction) {
          try {
            const ethUsdResp = await getEthUsd();
            transaction.usdValueAtTime = ethUsdResp * value;
          } catch (e) {
            console.error(e);
          }
          transaction.value = value;
          transaction.completed = true;
          transaction.completionDate = new Date();
          transaction.state = "done";
          transaction.txnHash = hash;
          await transaction.save();
        }

        user.balance.ether += value;
        pool.active = false;
        pool.activeStart = null;
        pool.user = null;
        await pool.save();
        await user.save();
        break;
      case "USDC":
        transaction = await Transaction.findOne({
          user: user._id,
          assetType: "USDC",
          transactionType: "deposit",
          completed: false,
        }).exec();
        if (transaction) {
          try {
            transaction.usdValueAtTime = value;
          } catch (e) {
            console.error(e);
          }
          transaction.value = value;
          transaction.completed = true;
          transaction.completionDate = new Date();
          transaction.state = "done";
          transaction.txnHash = hash;
          await transaction.save();
        }

        user.balance.usdc += value;
        pool.active = false;
        pool.activeStart = null;
        pool.user = null;
        await pool.save();
        await user.save();
        break;
    }
  }
};

export const getAndAssignPool: (user: UserDoc) => Promise<string> = async function (user: UserDoc): Promise<string> {
  const pool = await Pool.findOne({active: false}).exec();
  if (pool) {
    pool.active = true;
    pool.activeStart = Date.now();
    pool.user = user._id;
    await pool.save();
    return pool.address;
  } else {
    try {
      const wallet = await genWallet();
      const pool = new Pool({
        address: wallet.address.toLowerCase(),
        hashedKey: encryptGCM(wallet.privateKey, config.POOL_HASHKEY),
        user: user._id,
        active: true,
        activeStart: Date.now(),
      });
      await pool.save();
      await addAddressWebhook([wallet.address]);
      return pool.address;
    } catch (e) {
      throw new Error(e);
    }
  }
};

