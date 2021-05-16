require("dotenv").config();

export const PORT = process.env.PORT ? process.env.PORT : 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const MAIL = process.env.MAIL; // support email password
export const SECRET = process.env.SECRET; //jwt secret
export const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY; //etherscan api key
export const CRYPTOCOMPARE_KEY = process.env.CRYPTOCOMPARE_KEY; //cryptocompare api key
export const ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY : ""; //pool encryption
export const HttpProvider = process.env.HttpProvider; //alchemy http provider url
export const XAlchemyToken = process.env.XAlchemyToken; //alchemy auth token
export const ENCRYPTEDSEEDHEX = process.env.ENCRYPTEDSEEDHEX ? process.env.ENCRYPTEDSEEDHEX : ""; //escrow wallet encrypted seed hex
export const ServerAuth = process.env.SERVER_AUTH; //server communication auth for HMAC
export const PUBLIC_KEY_BITCLOUT = process.env.PUBLIC_KEY_BITCLOUT; //escrow wallet bitclout public key
export const SEED_HEX = process.env.SEED_HEX; //bitclout seed hex for identity
export const cfuid = "d948f4d42aa8cf1c00b7f93ba8951d45b1619496624";
export const ingressCookie = "c7d7d1526f37eb58ae5a7a5f87b91d24";
export const WEBHOOK_ID = 148926;
export const NETWORK = "kovan";
export const EXCHANGE_API = "http://localhost:5050";
export const ROLLBAR = process.env.ROLLBAR;
export const MinFeeRateNanosPerKB = 1000;
