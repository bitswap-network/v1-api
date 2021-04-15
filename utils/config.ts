require("dotenv").config();

export let PORT = process.env.PORT ? process.env.PORT : 5000;
export let MONGODB_URI = process.env.MONGODB_URI;
export let SECRET = process.env.SECRET;
export let WHITELIST = JSON.parse(
  process.env.WHITELIST ? process.env.WHITELIST : "[]"
);
export let MAIL = process.env.MAIL;