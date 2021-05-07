require("dotenv").config();

export let PORT = process.env.PORT ? process.env.PORT : 5000;
export let MONGODB_URI = process.env.MONGODB_URI;
export let MAIL = process.env.MAIL; // support email password
export let SECRET = process.env.SECRET; //jwt secret
export let ETHERSCAN_KEY = process.env.ETHERSCAN_KEY; //etherscan api key
export let CRYPTOCOMPARE_KEY = process.env.CRYPTOCOMPARE_KEY; //cryptocompare api key
export let ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY
  ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY
  : ""; //pool encryption
export let HttpProvider = process.env.HttpProvider; //alchemy http provider url
export let XAlchemyToken = process.env.XAlchemyToken; //alchemy auth token
export let ENCRYPTEDSEEDHEX = process.env.ENCRYPTEDSEEDHEX; //escrow wallet encrypted seed hex
export let ServerAuth = process.env.SERVER_AUTH; //server communication auth for HMAC
export let PUBLIC_KEY_BITCLOUT = process.env.PUBLIC_KEY_BITCLOUT; //escrow wallet bitclout public key
export let SEED_HEX = process.env.SEED_HEX; //bitclout seed hex for identity
export let cfuid = "d948f4d42aa8cf1c00b7f93ba8951d45b1619496624";
export let ingressCookie = "c7d7d1526f37eb58ae5a7a5f87b91d24";
export let WEBHOOK_ID = 148926;
export let NETWORK = "kovan";
export let FULFILLMENT_API = process.env.FULFILLMENT_API;
