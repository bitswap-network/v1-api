import { createHmac, randomBytes } from "crypto";
import { UserDoc } from "../models/user";
import { AxiosResponse } from "axios";
import axios from "axios";
import * as config from "./config";
const jwt = require("jsonwebtoken");

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

export const getGasEtherscan: () => Promise<AxiosResponse> = async function (): Promise<
  AxiosResponse<any>
> {
  return await axios.get(
    `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${config.ETHERSCAN_KEY}`
  );
};

export const getEthUsdCC: () => Promise<AxiosResponse> = async function (): Promise<
  AxiosResponse<any>
> {
  return await axios.get(
    `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`,
    {
      headers: { Authorization: `Apikey ${config.CRYPTOCOMPARE_KEY}` },
    }
  );
};

export const generateCode = (len: number) =>
  [...Array(len)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

export const generateAccessToken = (username: any) => {
  return jwt.sign(username, config.SECRET, { expiresIn: "18000s" });
};

export const generateHMAC = (body: any) => {
  const token = config.ServerAuth ? config.ServerAuth : "";
  const hmac = createHmac("sha256", token); // Create a HMAC SHA256 hash using the auth token
  hmac.update(JSON.stringify(body), "utf8");
  return hmac.digest("hex"); // If signature equals your computed hash, return true
};

export const genString = (size: number) => {
  return randomBytes(size).toString("base64").slice(0, size);
};

export const safeUserObject = (user: UserDoc) => {
  return {
    _id: user._id,
    admin: user.admin,
    bitclout: user.bitclout,
    balance: user.balance,
    email: user.email,
    transactions: user.transactions,
    username: user.username,
    verification: user.verification,
  };
};
