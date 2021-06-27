import { createHmac, randomBytes } from "crypto";
import { UserDoc } from "../models/user";
import Order from "../models/order";
import { bitcloutCfHeader } from "../helpers/bitclout";
import { AxiosResponse } from "axios";
import axios from "axios";
import crypto from "crypto";
import * as config from "./config";
const jwt = require("jsonwebtoken");
const algorithm = "aes-256-cbc";

export const verifyPersonaSignature = (request: any) => {
  const token = config.PERSONA_WH_SECRET;
  const sigParams: {
    t?: string;
    v1?: string;
  } = {};
  request.headers["persona-signature"].split(",").forEach(pair => {
    const [key, value] = pair.split("=");
    sigParams[key] = value;
  });
  if (sigParams.t && sigParams.v1) {
    const hmac = crypto
      .createHmac("sha256", token)
      .update(`${sigParams.t}.${JSON.stringify(request.body)}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sigParams.v1));
  } else {
    return false;
  }
};

export const verifyAlchemySignature = (request: any) => {
  const token = config.XAlchemyToken;
  if (token) {
    const headers = request.headers;
    const signature = headers["x-alchemy-signature"]; // Lowercase for NodeJS
    const body = request.body;
    const hmac = createHmac("sha256", token); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), "utf8");
    const digest = hmac.digest("hex");
    return signature === digest; // If signature equals your computed hash, return true
  } else {
    throw new Error("missing token");
  }
};

export const verifySignature = (request: any) => {
  const token = config.ServerAuth ? config.ServerAuth : "";
  if (token) {
    const headers = request.headers;
    const signature = headers["server-signature"]; // Lowercase for NodeJS
    const body = request.body;
    const hmac = createHmac("sha256", token); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), "utf8");
    const digest = hmac.digest("hex");
    return signature === digest; // If signature equals your computed hash, return true
  } else {
    throw new Error("missing token");
  }
};
//add typed response
export const getGasEtherscan: () => Promise<AxiosResponse> = async function (): Promise<AxiosResponse<any>> {
  return await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${config.ETHERSCAN_KEY}`);
};
//add typed response
export const getEthUsd = async (): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    axios
      .get(`${config.EXCHANGE_API}/ethusd`)
      .then(response => {
        resolve(response.data.result);
      })
      .catch(error => {
        reject(error);
      });
  });
};
export const getBitcloutUsd = async (): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    axios
      .get("https://bitclout.com/api/v0/get-exchange-rate", bitcloutCfHeader)
      .then(response => {
        const bitcloutPerUSD =
          1e9 / ((1e9 / response.data.SatoshisPerBitCloutExchangeRate / (response.data.USDCentsPerBitcoinExchangeRate / 100)) * 1e8);
        resolve(bitcloutPerUSD);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const getOrderbookState: () => Promise<AxiosResponse> = async function (): Promise<AxiosResponse<any>> {
  return await axios.get(`${config.EXCHANGE_API}/orderbook-state`);
};

//add typed response
export const getMarketPrice: (side: string, quantity: number) => Promise<AxiosResponse> = async function (
  side: string,
  quantity: number
): Promise<AxiosResponse<any>> {
  return await axios.get(`${config.EXCHANGE_API}/market-price/${side}/${quantity}`);
};

export const generateCode = (len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

export const generateAccessToken = (PublicKeyBase58Check: any) => {
  return jwt.sign(PublicKeyBase58Check, config.SECRET, { expiresIn: "18000s" });
};

export const generateHMAC = (body: any) => {
  const token = config.ServerAuth ? config.ServerAuth : "";
  const hmac = createHmac("sha256", token); // Create a HMAC SHA256 hash using the auth token
  hmac.update(JSON.stringify(body), "utf8");
  return hmac.digest("hex"); // If signature equals your computed hash, return true
};

export const generateHandshake = (timestamp: number) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(config.ServerAuth), iv);
  let encrypted = cipher.update(timestamp.toString());
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + "-" + encrypted.toString("hex");
};

export const genString = (size: number) => {
  return randomBytes(size).toString("base64").slice(0, size);
};

export const toNanos = (value: number) => {
  return parseInt((value * 1e9).toString());
};

export const orderBalanceValidate = async (user: UserDoc, type: string, side: string, quantity: number, price?: number) => {
  const orders = await Order.find({ username: user.bitclout.publicKey, complete: false }).exec();
  if (user.balance.in_transaction) {
    return false;
  } else {
    if (type === "market" && side === "buy") {
      const ethPriceResp = await getEthUsd();
      const totalPriceResp = await getMarketPrice(side, quantity);
      const totalEth = totalPriceResp.data.price / ethPriceResp;
      return totalEth <= user.balance.ether;
    } else if (type === "limit" && price) {
      if (orders.length >= 10) {
        return false;
      } else {
        if (side === "buy") {
          const ethPriceResp = await getEthUsd();
          const totalPrice = quantity * price;
          const totalEth = totalPrice / ethPriceResp;
          return totalEth <= user.balance.ether;
        } else {
          return quantity <= user.balance.bitclout;
        }
      }
    } else {
      return quantity <= user.balance.bitclout;
    }
  }
};

export const userVerifyCheck = (user: UserDoc) => {
  return user.verification.email;
};
