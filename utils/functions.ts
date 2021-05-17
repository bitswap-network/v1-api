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
//add typed response
export const getGasEtherscan: () => Promise<AxiosResponse> = async function (): Promise<AxiosResponse<any>> {
  return await axios.get(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${config.ETHERSCAN_KEY}`);
};
//add typed response
export const getEthUsd: () => Promise<AxiosResponse> = async function (): Promise<AxiosResponse<any>> {
  return await axios.get(`${config.EXCHANGE_API}/ethusd`);
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

export const genString = (size: number) => {
  return randomBytes(size).toString("base64").slice(0, size);
};

export const toNanos = (value: number) => {
  return parseInt((value * 1e9).toString());
};

export const orderBalanceValidate = async (user: UserDoc, type: string, side: string, quantity: number, price?: number) => {
  if (type === "market" && side === "buy") {
    const ethPriceResp = await getEthUsd();
    const totalPriceResp = await getMarketPrice(side, quantity);
    const totalEth = totalPriceResp.data.price / ethPriceResp.data.result;
    return totalEth <= user.balance.ether;
  } else if (type === "limit" && side === "buy" && price) {
    const ethPriceResp = await getEthUsd();
    const totalPrice = quantity * price;
    const totalEth = totalPrice / ethPriceResp.data.result;
    return totalEth <= user.balance.ether;
  } else {
    return quantity <= user.balance.bitclout;
  }
};

export const userVerifyCheck = (user: UserDoc) => {
  return user.verification.status === "verified" && user.verification.email;
};
