require("dotenv").config();

export let PORT = process.env.PORT ? process.env.PORT : 5000;
export let MONGODB_URI = process.env.MONGODB_URI;
export let SECRET = process.env.SECRET;
export let MAIL = process.env.MAIL;
export let HttpProvider = process.env.HttpProvider;
export let XAlchemyToken = process.env.XAlchemyToken;
export let FULFILLMENT_API = process.env.FULFILLMENT_API;
export let ServerAuth = process.env.SERVER_AUTH;
export let PUBLIC_KEY_BITCLOUT = process.env.PUBLIC_KEY_BITCLOUT;
export let ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
export let CRYPTOCOMPARE_KEY = process.env.CRYPTOCOMPARE_KEY;
export let ADDRESS_ENCRYPT_PRIVATEKEY = process.env.ADDRESS_ENCRYPT_PRIVATEKEY
  ? process.env.ADDRESS_ENCRYPT_PRIVATEKEY
  : "";
export let cfuid = "d948f4d42aa8cf1c00b7f93ba8951d45b1619496624";
export let ingressCookie = "c7d7d1526f37eb58ae5a7a5f87b91d24";
export let WEBHOOK_ID = 148926;
export let NETWORK = process.env.NETWORK;
export let ENCRYPTEDSEEDHEX = process.env.ENCRYPTEDSEEDHEX;
