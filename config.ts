require("dotenv").config();

export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const URL =
  process.env.ENVIRONMENT === "production" ? "https://bitswap-core-api.herokuapp.com/" : "https://bitswap-core-api-staging.herokuapp.com/";
export const BITCLOUT_API_URL = "http://node.bitswap.network/";
export const EMAIL_KEY = process.env.MAIL; // support email password
export const JWT_KEY = process.env.SECRET; //jwt secret
export const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY; //etherscan api key
export const POOL_HASHKEY = process.env.POOL_HASHKEY ? process.env.POOL_HASHKEY : ""; //pool encrypt key
export const WALLET_HASHKEY = process.env.WALLET_HASHKEY ? process.env.WALLET_HASHKEY : ""; //wallet encrypt key
export const ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY : ""; //pool encryption
export const WSProvider = process.env.WSProvider; //alchemy ws provider url
export const HTTPProvider = process.env.HttpProvider ? process.env.HttpProvider : "";
export const XAlchemyToken = process.env.XAlchemyToken; //alchemy auth token
export const FIREEYE_KEY = process.env.SERVER_AUTH ? process.env.SERVER_AUTH : ""; //server communication auth for HMAC
export const PUBLIC_KEY_BITCLOUT = process.env.PUBLIC_KEY_BITCLOUT; //escrow wallet bitclout public key
export const WEBHOOK_ID = process.env.ENVIRONMENT === "production" ? 149208 : 149102;
export const NETWORK = process.env.ENVIRONMENT === "production" ? "mainnet" : "kovan";
export const EXCHANGE_API =
  process.env.ENVIRONMENT === "production"
    ? "https://bitswap-exchange-api.herokuapp.com"
    : "https://bitswap-exchange-api-staging.herokuapp.com";
export const MinFeeRateNanosPerKB = 1000;
export const MNEMONIC = process.env.MNEMONIC ? process.env.MNEMONIC.replace(/-/g, " ") : "";
export const PERSONA_APIKEY = process.env.PERSONA_APIKEY ? process.env.PERSONA_APIKEY : "";
export const PERSONA_WH_SECRET = process.env.PERSONA_WH_SECRET ? process.env.PERSONA_WH_SECRET : "";

export const BLACKLISTED_ETH_ADDR = [
  "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
  "0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b",
  "0xa7e5d5a720f06526557c513402f2e6b5fa20b00",
  "0x901bb9583b24d97e995513c6778dc6888ab6870e",
  "0x7f367cc41522ce07553e823bf3be79a889debe1b",
  "0x72a5843cc08275c8171e582972aa4fda8c397b2a",
  "0x7f19720a857f834887fc9a7bc0a0fbe7fc7f8102",
  "0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a",
  "0x7db418b5d567a4e0e8c59ad71be1fce48f3e6107",
  "0x9f4cda013e354b8fc285bf4b9a60460cee7f7ea9",
];
