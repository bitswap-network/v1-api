import crypto from "crypto";
import * as config from "../utils/config";
import Pool, { poolDoc } from "../models/pool";
import User, { UserDoc } from "../models/user";
import { getBalance, genWallet, addAddressWebhook } from "../helpers/web3";
import { getEthUsd } from "../utils/functions";
import Transaction from "../models/transaction";
const algorithm = "aes-256-cbc";

export const syncWalletBalance = async () => {
  const pools = await Pool.find({}).exec();
  pools.forEach(async pool => {
    try {
      const balance = await getBalance(pool.address.toLowerCase());
      pool.balance = parseFloat(balance);
      await pool.save();
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
  if (pool && user && asset == "ETH") {
    const transaction = await Transaction.findOne({
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
  }
};

export const getAndAssignPool: (user: UserDoc) => Promise<string> = async function (user: UserDoc): Promise<string> {
  const pool = await Pool.findOne({ active: false }).exec();
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
        hashedKey: encryptAddressGCM(wallet.privateKey),
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

export const encryptAddressGCM = (address: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(config.POOL_HASHKEY), iv);
  // Hint: Larger inputs (it's GCM, after all!) should use the stream API
  let enc = cipher.update(address, "utf8", "base64");
  enc += cipher.final("base64");
  return enc + ":" + iv.toString("base64") + ":" + cipher.getAuthTag().toString("base64");
};

export const decryptAddressGCM = (address: string) => {
  const addressSplit = address.split(":");
  const iv = Buffer.from(addressSplit[1], "base64");
  const authTag = Buffer.from(addressSplit[2], "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(config.POOL_HASHKEY), iv);
  decipher.setAuthTag(authTag);
  let str = decipher.update(addressSplit[0], "base64", "utf8");
  str += decipher.final("utf8");
  return str;
};
