import axios from "axios";
import { handleSign } from "../helpers/identity";
import { bitcloutCfHeader } from "../helpers/bitclout";
const EthereumTx = require("ethereumjs-tx").Transaction;

import * as config from "./config";
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(config.HttpProvider));

const sendEth = async (
  priv_key: string,
  from_address: string,
  to_address: string,
  value: number,
  nonce: number,
  gasprice: number
) => {
  let rawTx = {
    to: to_address,
    from: from_address,
    value: web3.utils.toHex(
      web3.utils.toWei((value - (21000 * gasprice) / 1e9).toString())
    ),
    gasLimit: web3.utils.toHex(21000),
    gasPrice: web3.utils.toHex(web3.utils.toWei(gasprice.toString(), "gwei")),
    nonce: web3.utils.toHex(nonce)
  };
  console.log(rawTx, gasprice, nonce);
  const transaction = new EthereumTx(rawTx, {
    chain: config.NETWORK
  });
  transaction.sign(web3.utils.hexToBytes(priv_key));
  const serializedTransaction = transaction.serialize();

  return web3.eth.sendSignedTransaction(
    "0x" + serializedTransaction.toString("hex")
  );
};

const sendBitclout = (bitcloutpubkey: string, amountnanos: number) => {
  console.log("sending bclt");

  return axios.post(
    "https://api.bitclout.com/send-bitclout",
    JSON.stringify({
      AmountNanos: parseInt(amountnanos.toString()),
      MinFeeRateNanosPerKB: 1000,
      RecipientPublicKeyOrUsername: bitcloutpubkey,
      SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT
    }),
    bitcloutCfHeader
  );
};
const submitTransaction = async (txnhex: string) => {
  const signedTxn = handleSign({
    encryptedSeedHex: config.ENCRYPTEDSEEDHEX,
    transactionHex: txnhex
  });

  console.log("submitting txn");
  return axios.post(
    "https://api.bitclout.com/submit-transaction",
    JSON.stringify({
      TransactionHex: signedTxn.signedTransactionHex
    }),
    bitcloutCfHeader
  );
};

const sendAndSubmitBitclout = async (
  bitcloutpubkey: string,
  amountnanos: number
) => {
  try {
    const txnPreFlight = await sendBitclout(bitcloutpubkey, amountnanos);
    await submitTransaction(txnPreFlight.data.TransactionHex);
    return txnPreFlight.data.TransactionIDBase58Check;
  } catch (e) {
    throw new Error(e);
  }
};

export { sendBitclout, sendEth, submitTransaction, sendAndSubmitBitclout };
