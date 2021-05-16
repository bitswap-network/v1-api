import crypto from "crypto";
import * as config from "../utils/config";
import Pool, { poolDoc } from "../models/pool";
import User from "../models/user";
import { genWallet, addAddressWebhook } from "../helpers/web3";
import Transaction from "../models/transaction";
const algorithm = "aes-256-cbc";

export const processDeposit: (
  pool_id: string,
  value: number,
  asset: string,
  hash: string
) => void = async function (
  pool_id: string,
  value: number,
  asset: string,
  hash: string
): Promise<void> {
  const pool = await Pool.findById(pool_id).exec();
  const user = await User.findById(pool!.user).exec();
  if (pool && user) {
    const transaction = await Transaction.findOne({
      user: user._id,
      assetType: "ETH",
      transactionType: "deposit",
      completed: false,
    }).exec();
    transaction!.value = value;
    transaction!.completed = true;
    transaction!.completionDate = new Date();
    transaction!.txnHash = hash;
    user.balance.ether += value;
    user.onGoingDeposit = null;
    pool.active = false;
    pool.activeStart = null;
    pool.user = null;
    await transaction!.save();
    await pool.save();
    await user.save();
  }
};

export const getAndAssignPool: (
  user_id: string
) => Promise<string> = async function (
  user_id: string
): Promise<string> | never {
  const pool = await Pool.findOne({ active: false }).exec();
  const user = await User.findById(user_id).exec();
  if (user) {
    if (pool) {
      pool.active = true;
      pool.activeStart = Date.now();
      pool.user = user._id;
      return pool._id;
    } else {
      try {
        const wallet = await genWallet();
        const pool = new Pool({
          address: wallet.address.toLowerCase(),
          privateKey: encryptAddress(wallet.privateKey),
          user: user._id,
          active: true,
          activeStart: Date.now(),
        });
        await addAddressWebhook([wallet.address]);
        await pool.save();
        return pool.address;
      } catch (e) {
        throw new Error(e);
      }
    }
  } else {
    throw new Error("user id not found");
  }
};

export const encryptAddress = (address: string) => {
  const salt = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(config.ADDRESS_ENCRYPT_PRIVATEKEY),
    salt
  );
  let encrypted = cipher.update(address);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    salt: salt.toString("hex"),
    encryptedKey: encrypted.toString("hex"),
  };
};

export const decryptAddress = (keyObject: poolDoc["privateKey"]) => {
  const salt = Buffer.from(keyObject.salt, "hex");
  const encryptedAddress = Buffer.from(keyObject.encryptedKey, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(config.ADDRESS_ENCRYPT_PRIVATEKEY),
    salt
  );
  let decrypted = decipher.update(encryptedAddress);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
