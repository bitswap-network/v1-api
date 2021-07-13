import User, { UserDoc } from "../models/user";
import Wallet from "../models/wallet";
import Order from "../models/order";
import { getKeyPair, transferBitcloutBalance } from "./bitclout";
import { decryptGCM, encryptGCM } from "./crypto";
import * as config from "../config";
import { toNanos, toWei } from "../utils/functions";
import { getEthUsd } from "../utils/functions";
/*
Only use initially when having to generate user bitclout wallets

*/
export const generateUserBitcloutWallets = async () => {
  const users = await User.find({}).exec();
  users.forEach(async (user: UserDoc) => {
    try {
      const walletCheck = await Wallet.findOne({ user: user._id }).exec();
      if (!walletCheck) {
        const keyPair = (await getKeyPair({ Mnemonic: config.MNEMONIC, ExtraText: user._id.toString(), Index: 0 })).data;
        const userWallet = new Wallet({
          keyInfo: {
            bitclout: {
              publicKeyBase58Check: keyPair.PublicKeyBase58Check,
              publicKeyHex: keyPair.PublicKeyHex,
              privateKeyBase58Check: encryptGCM(keyPair.PrivateKeyBase58Check, config.WALLET_HASHKEY),
              privateKeyHex: encryptGCM(keyPair.PrivateKeyHex, config.WALLET_HASHKEY),
              extraText: encryptGCM(user._id.toString(), config.WALLET_HASHKEY),
              index: 0,
            },
          },
          user: user._id,
          balance: {
            bitclout: 0,
          },
          super: 1,
          status: 0,
        });
        await userWallet.save();
        console.log(user.bitclout.username, userWallet.keyInfo.bitclout.publicKeyBase58Check);
      }
    } catch (e) {
      console.error(e);
    }
  });
};

export const createMainWallet = async () => {
  const keyPair = (await getKeyPair({ Mnemonic: config.MNEMONIC, ExtraText: "", Index: 0 })).data;
  const walletCheck = await Wallet.findOne({
    "keyInfo.bitclout.publicKeyBase58Check": "BC1YLiYo25DLiUf9XfNPWD4EPcuZkUTFnRCeq9RjRum1gkaYJ2K4Vu1",
  }).exec();
  if (!walletCheck) {
    const mainWallet = new Wallet({
      keyInfo: {
        bitclout: {
          publicKeyBase58Check: keyPair.PublicKeyBase58Check,
          publicKeyHex: keyPair.PublicKeyHex,
          privateKeyBase58Check: encryptGCM(keyPair.PrivateKeyBase58Check, config.WALLET_HASHKEY),
          privateKeyHex: encryptGCM(keyPair.PrivateKeyHex, config.WALLET_HASHKEY),
          extraText: "",
          index: 0,
        },
      },
      user: null,
      balance: {
        bitclout: 0,
      },
      super: 0,
      status: 0,
    });
    console.log("Wallet created: ", mainWallet);
    await mainWallet.save();
  } else {
    console.log("Wallet exists: ", walletCheck);
  }
};

export const migrateUserBalances = async () => {
  const users = await User.find({ "balance.updatedToInt": { $ne: true } }).exec();
  users.forEach(async user => {
    if (user.balance.bitclout > 0 || user.balance.ether > 0) {
      user.balance.bitclout = toNanos(user.balance.bitclout);
      user.balance.ether = toWei(user.balance.ether);
      user.balance.updatedToInt = true;
      await user.save();
    }
  });
};

export const patchOrderMissingFees = async () => {
  const orders = await Order.find({ execPrice: { $exists: false } }).exec();
  orders.forEach(async order => {
    order.execPrice = order.orderPrice;
    await order.save();
  });
};

export const patchOrderFees = async () => {
  const orders = await Order.find({ orderQuantityProcessed: { $gt: 0 }, updated: { $ne: true } }).exec();
  const ethUsd = 2000;
  orders.forEach(async order => {
    if (order.orderSide == "buy") {
      order.fees = toNanos(order.orderQuantityProcessed * 0.01);
    } else {
      order.fees = toWei((order.orderQuantityProcessed * order.execPrice * 0.01) / ethUsd);
    }
    console.log(order.fees);
    order.updated = true;
    await order.save();
  });
};

export const formatUserBalances = (user: UserDoc) => {
  user.balance.bitclout = +(user.balance.bitclout / 1e9).toFixed(9);
  user.balance.ether = +(user.balance.ether / 1e18).toFixed(18);
  user.balance.usdc = +(user.balance.usdc / 1e6).toFixed(6);
  return user;
};

export const formatUserBalancesInt = async () => {
  try {
    const users = await User.find({}).exec();
    users.forEach(async user => {
      user.balance.bitclout = parseInt(user.balance.bitclout.toString());
      user.balance.ether = parseInt(user.balance.ether.toString());
      await user.save();
    });
  } catch (e) {
    console.error(e);
  }
};

export const formatDB = async () => {
  try {
    await patchOrderMissingFees();
    await patchOrderFees();
    await migrateUserBalances();
  } catch (e) {
    console.error(e);
  }
};
