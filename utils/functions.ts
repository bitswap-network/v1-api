import { createHmac, randomBytes } from "crypto";
import { UserDoc } from "../models/user";
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

export const genString = (size: number) => {
  return randomBytes(size).toString("base64").slice(0, size);
};

export const completeEmail = (id: string) => {
  return {
    header: "BitSwap exchange completed",
    body: {
      seller: `<!DOCTYPE html><html><body><p>One of your swaps has been fulfilled, you can check the details on the <a href="https://app.bitswap.network/listing/${id}">listing page</a>.</p></body></html>`,
      buyer: `<!DOCTYPE html><html><body><p>One of your buys has been fulfilled, you can check the details on the <a href="https://app.bitswap.network/listing/${id}">listing page</a>.</p></body></html>`,
    },
  };
};

export const passwordResetEmail = (code: string) => {
  return {
    header: "Reset your BitSwap password",
    body:
      `<!DOCTYPE html><html><head><title>BitSwap Password Reset</title><body>` +
      `<p>Click <a href="https://api.bitswap.network/user/verifypassword/${code}">here</a> to reset your password. If you didn't request a password change, simply ignore this email.` +
      `</body></html>`,
  };
};

export const verifyPasswordHTML = (password: string) => {
  return `<!DOCTYPE html><html><body><p>Your password has been reset. Your temporary password is "${password}" (no quotation marks). Please change your password once you sign in.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>`;
};

export const transactionNotificationEmail = (username: string, id: string) => {
  return {
    header: "Transaction Notification Alert",
    body:
      `<!DOCTYPE html><html><head><title>Transaction Notification Alert</title><body>` +
      `<p>@${username} has started a transaction with your listing.` +
      `<p>Click <a href="https://app.bitswap.network/listing/${id}">here</a> to view.</p>` +
      `</body></html>`,
  };
};

export const emailVerify = (
  username: string,
  email_code: string,
  bitclout_code: string
) => {
  return {
    header: "Verify your BitSwap email",
    body:
      `<!DOCTYPE html><html><head><title>BitSwap Email Verification</title><body>` +
      `<p>Click <a href="https://bitswap-api.herokuapp.com/user/verifyemail/${email_code}">here</a> to verify your email. If this wasn't you, simply ignore this email.` +
      `<p>Make a post on your $${username} BitClout profile saying: "Verifying my @BitSwap account. ${bitclout_code}" (make sure you tag us) to verify that you own this BitClout account.</p>` +
      `</body></html>`,
  };
};

export const safeUserObject = (user: UserDoc) => {
  return {
    _id: user._id,
    admin: user.admin,
    bitcloutpubkey: user.bitcloutpubkey,
    bitswapbalance: user.bitswapbalance,
    buys: user.buys,
    buystate: user.buystate,
    email: user.email,
    ethereumaddress: user.ethereumaddress,
    listings: user.listings,
    transactions: user.transactions,
    username: user.username,
    verified: user.verified,
    bitcloutverified: user.bitcloutverified,
    profilepicture: user.profilepicture,
    description: user.description,
  };
};
