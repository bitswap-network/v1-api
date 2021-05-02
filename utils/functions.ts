import { createHmac, randomBytes } from "crypto";
import { ec as EC } from "elliptic";
import jwtDecode, { JwtPayload } from "jwt-decode";
import KeyEncoder from "key-encoder";
const bs58check = require("bs58check");
const jwt = require("jsonwebtoken");
const config = require("./config");
var ec = new EC("secp256k1");

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
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};
export const validateBitcloutJWT = (publicKey: string, token: string) => {
  const keyEncoder = new KeyEncoder("secp256k1");
  try {
    let pubKeyBytes = bs58check.decode(publicKey);
    let x = pubKeyBytes.subarray(1, pubKeyBytes.length);
    let y = pubKeyBytes.subarray(33, pubKeyBytes.length);
    var key = ec.keyFromPublic({ x, y }, "hex");
    console.log(pubKeyBytes, x);
    // const decoded = jwtDecode<JwtPayload>(jwt);
    var pemPublicKey = keyEncoder.encodePublic(publicKey, "raw", "pem");

    console.log(publicKey, pemPublicKey);
    try {
      const decoded = jwt.verify(token, pemPublicKey, {
        algorithms: ["ES256"],
      });
      console.log(decoded);
    } catch (err) {
      console.log(err);
    }

    // console.log(decoded);

    // console.log(key);
  } catch (e) {
    console.error(e);
  }
};
