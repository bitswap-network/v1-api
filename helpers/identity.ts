import * as config from "../utils/config";
import { createDecipher } from "crypto";
import { ec as EC } from "elliptic";
import * as sha256 from "sha256";
const jwt = require("jsonwebtoken");
const KeyEncoder = require("key-encoder").default;
const bs58check = require("bs58check");

export const validateJwt = (bitCloutPublicKey: string, jwtToken: string) => {
  const ec = new EC("secp256k1");
  const bitCloutPublicKeyDecoded = bs58check.decode(bitCloutPublicKey);
  const bitCloutPublicKeyDecodedArray = [...bitCloutPublicKeyDecoded];

  const rawPublicKeyArray = bitCloutPublicKeyDecodedArray.slice(3);

  const rawPublicKeyHex = ec
    .keyFromPublic(rawPublicKeyArray, "hex")
    .getPublic()
    .encode("hex", true);

  const keyEncoder = new KeyEncoder("secp256k1");
  const rawPublicKeyEncoded = keyEncoder.encodePublic(
    rawPublicKeyHex,
    "raw",
    "pem"
  );

  const result = jwt.verify(jwtToken, rawPublicKeyEncoded, {
    algorithms: ["ES256"],
  });
  return result;
};

const decryptSeedHex = (encryptedSeedHex: string) => {
  const encryptionKey = config.SEED_HEX ? config.SEED_HEX : "";
  const decipher = createDecipher("aes-256-gcm", encryptionKey);
  return decipher.update(Buffer.from(encryptedSeedHex, "hex")).toString();
};

const encryptedSeedHexToPrivateKey = (encryptedSeedHex: string) => {
  const seedHex = decryptSeedHex(encryptedSeedHex);
  return seedHexToPrivateKey(seedHex);
};
const seedHexToPrivateKey = (seedHex: string) => {
  const ec = new EC("secp256k1");
  return ec.keyFromPrivate(seedHex);
};

export const handleSign = (data: any) => {
  const { encryptedSeedHex, transactionHex } = data;
  const privateKey = encryptedSeedHexToPrivateKey(encryptedSeedHex);

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

  return {
    signature,
    signedTransactionHex: signedTransactionBytes.toString("hex"),
  };
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
