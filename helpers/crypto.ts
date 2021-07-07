import crypto from "crypto";
import * as config from "../config";
import {ec as EC} from "elliptic";
import * as sha256 from "sha256";
import HDNode from "hdkey";
import * as bip39 from "bip39";
import HDKey from "hdkey";
const jwt = require("jsonwebtoken");
const KeyEncoder = require("key-encoder").default;
const bs58check = require("bs58check");
const encryptAlgorithm = "aes-256-gcm";

export const validateJwt = (bitCloutPublicKey: string, jwtToken: string) => {
  const ec = new EC("secp256k1");
  const bitCloutPublicKeyDecoded = bs58check.decode(bitCloutPublicKey);
  const bitCloutPublicKeyDecodedArray = [...bitCloutPublicKeyDecoded];

  const rawPublicKeyArray = bitCloutPublicKeyDecodedArray.slice(3);

  const rawPublicKeyHex = ec.keyFromPublic(rawPublicKeyArray, "hex").getPublic().encode("hex", true);

  const keyEncoder = new KeyEncoder("secp256k1");
  const rawPublicKeyEncoded = keyEncoder.encodePublic(rawPublicKeyHex, "raw", "pem");

  const result = jwt.verify(jwtToken, rawPublicKeyEncoded, {
    algorithms: ["ES256"],
  });
  return result;
};

const mnemonicToKeychain = (mnemonic: string, extraText?: string, nonStandard?: boolean): HDNode => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, extraText);
  // @ts-ignore
  return HDKey.fromMasterSeed(seed).derive("m/44'/0'/0'/0/0", nonStandard);
};

const keychainToSeedHex = (keychain: HDNode): string => {
  return keychain.privateKey.toString("hex");
};

const seedHexToPrivateKey = (seedHex: string) => {
  const ec = new EC("secp256k1");
  return ec.keyFromPrivate(seedHex);
};

export const handleSign = (transactionHex: string) => {
  const keychain = mnemonicToKeychain(config.MNEMONIC);
  const seedHex = keychainToSeedHex(keychain);
  const privateKey = seedHexToPrivateKey(seedHex);
  const transactionBytes = Buffer.from(transactionHex, "hex");
  const transactionHash = Buffer.from(sha256.x2(transactionBytes), "hex");
  const signature = privateKey.sign(transactionHash);
  const signatureBytes = Buffer.from(signature.toDER());
  const signatureLength = uintToBuf(signatureBytes.length);

  const signedTransactionBytes = Buffer.concat([
    // This slice is bad. We need to remove the existing signature length field prior to appending the new one.
    // Once we have frontend transaction construction we won't need to do this.
    transactionBytes.slice(0, -1),
    signatureLength,
    signatureBytes,
  ]);

  return signedTransactionBytes.toString("hex");
};
const uintToBuf = (uint: number) => {
  const result: number[] = [];
  while (uint > 0x80) {
    result.push((uint & 0xff) | 0x80);
    uint >>>= 7;
  }

  result.push(uint | 0);

  return Buffer.from(result);
};

export const encryptGCM = (text: string, key: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(encryptAlgorithm, Buffer.from(key), iv);
  // todo: Larger inputs (it's GCM, after all!) should use the stream API
  let enc = cipher.update(text, "utf8", "base64");
  enc += cipher.final("base64");
  return enc + ":" + iv.toString("base64") + ":" + cipher.getAuthTag().toString("base64");
};

export const decryptGCM = (text: string, key: string) => {
  const textSplit = text.split(":");
  const iv = Buffer.from(textSplit[1], "base64");
  const authTag = Buffer.from(textSplit[2], "base64");
  const decipher = crypto.createDecipheriv(encryptAlgorithm, Buffer.from(key), iv);
  decipher.setAuthTag(authTag);
  let str = decipher.update(textSplit[0], "base64", "utf8");
  str += decipher.final("utf8");
  return str;
};
