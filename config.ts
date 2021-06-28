require("dotenv").config();

export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const URL =
  process.env.ENVIRONMENT === "production" ? "https://bitswap-core-api.herokuapp.com/" : "https://bitswap-core-api-staging.herokuapp.com/";
export const BITCLOUT_API_URL = "http://node.bitswap.network/";
export const EMAIL_KEY = process.env.MAIL; // support email password
export const JWT_KEY = process.env.SECRET; //jwt secret
export const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY; //etherscan api key
export const POOL_HASHKEY = process.env.POOL_HASHKEY ? process.env.POOL_HASHKEY : ""; //etherscan api key
export const ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY : ""; //pool encryption
export const WSProvider = process.env.WSProvider; //alchemy ws provider url
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
