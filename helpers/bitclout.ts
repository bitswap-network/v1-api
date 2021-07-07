import axios from "axios";
import * as config from "../config";
import {
  ProfileAPIInterface,
  TxnPreflightInterface,
  TransactionAPIInterface,
  SubmitTransactionInterface,
  SubmitTransactionAPIInterface,
  GetKeyPairInterface,
  GetKeyPairAPIInterface,
} from "../interfaces/bitclout";

export const bitcloutHeader = {
  headers: {
    "Content-Type": "application/json",
  },
};

export const getKeyPair: (keyPairAttributes: GetKeyPairInterface) => Promise<GetKeyPairAPIInterface> = async function (
  keyPairAttributes: GetKeyPairInterface
): Promise<GetKeyPairAPIInterface> {
  return await axios.post(`${config.BITCLOUT_API_URL}api/v1/key-pair`, JSON.stringify(keyPairAttributes), bitcloutHeader);
};

export const preflightTransaction: (transaction: TxnPreflightInterface) => Promise<TransactionAPIInterface> = async function (
  transaction: TxnPreflightInterface
): Promise<TransactionAPIInterface> {
  return await axios.post(`${config.BITCLOUT_API_URL}api/v0/send-bitclout`, JSON.stringify(transaction), bitcloutHeader);
};

export const submitTransaction: (transaction: SubmitTransactionInterface) => Promise<SubmitTransactionAPIInterface> = async function (
  transaction: SubmitTransactionInterface
): Promise<SubmitTransactionAPIInterface> {
  return await axios.post(`${config.BITCLOUT_API_URL}api/v0/submit-transaction`, JSON.stringify(transaction), bitcloutHeader);
};

export const getSingleProfile: (PublicKeyBase58Check: string, Username?: string) => Promise<ProfileAPIInterface> = async function (
  PublicKeyBase58Check: string,
  Username?: string
): Promise<ProfileAPIInterface> {
  return await axios.post(
    `${config.BITCLOUT_API_URL}api/v0/get-single-profile`,
    JSON.stringify({
      PublicKeyBase58Check: PublicKeyBase58Check,
      Username: Username,
    }),
    bitcloutHeader
  );
};
