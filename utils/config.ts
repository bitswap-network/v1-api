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
