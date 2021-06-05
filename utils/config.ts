require("dotenv").config();

export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const URL =
  process.env.ENVIRONMENT === "production" ? "https://bitswap-core-api.herokuapp.com/" : "https://bitswap-core-api-staging.herokuapp.com/";
export const MAIL = process.env.MAIL; // support email password
export const SECRET = process.env.SECRET; //jwt secret
export const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY; //etherscan api key
export const ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY : ""; //pool encryption
export const HttpProvider = process.env.HttpProvider; //alchemy http provider url
export const XAlchemyToken = process.env.XAlchemyToken; //alchemy auth token
export const ServerAuth = process.env.SERVER_AUTH ? process.env.SERVER_AUTH : ""; //server communication auth for HMAC
export const PUBLIC_KEY_BITCLOUT = process.env.PUBLIC_KEY_BITCLOUT; //escrow wallet bitclout public key
export const cfuid = "d948f4d42aa8cf1c00b7f93ba8951d45b1619496624";
export const ingressCookie = "c7d7d1526f37eb58ae5a7a5f87b91d24";
export const WEBHOOK_ID = process.env.ENVIRONMENT === "production" ? 149131 : 149102;
export const NETWORK = process.env.ENVIRONMENT === "production" ? "mainnet" : "kovan";
export const EXCHANGE_API =
  process.env.ENVIRONMENT === "production"
    ? "https://bitswap-exchange-api-prod.herokuapp.com"
    : "https://bitswap-exchange-api-staging.herokuapp.com";
export const MinFeeRateNanosPerKB = 1000;
export const MNEMONIC = process.env.MNEMONIC ? process.env.MNEMONIC.replace(/-/g, " ") : "";
