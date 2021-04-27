import { createHmac } from "crypto";

const jwt = require("jsonwebtoken");
const config = require("./config");

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
