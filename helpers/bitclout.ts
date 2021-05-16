import axios from "axios";
import { AxiosResponse } from "axios";
import * as config from "../utils/config";
import {
  ProfileAPIInterface,
  PostsAPIInterface,
  txnPreflightInterface,
  TransactionAPIInterface,
  submitTransactionInterface,
  SubmitTransactionAPIInterface,
} from "../interfaces/bitclout";
import { generateHMAC } from "../utils/functions";

const cfIngressCookie = {
  Cookie: `__cfduid=${config.cfuid}; INGRESSCOOKIE=${config.ingressCookie}`,
};
export const bitcloutCfHeader = {
  headers: {
    ...cfIngressCookie,
    "Content-Type": "application/json",
  },
};

export const preFlightDeposit: (
  transaction: txnPreflightInterface
) => Promise<TransactionAPIInterface> = async function (
  transaction: txnPreflightInterface
): Promise<TransactionAPIInterface> {
  return await axios.post(
    "https://api.bitclout.com/send-bitclout",
    JSON.stringify(transaction),
    bitcloutCfHeader
  );
};

export const submitTransaction: (
  transaction: submitTransactionInterface
) => Promise<SubmitTransactionAPIInterface> = async function (
  transaction: submitTransactionInterface
): Promise<SubmitTransactionAPIInterface> {
  return await axios.post(
    "https://api.bitclout.com/submit-transaction",
    JSON.stringify(transaction),
    bitcloutCfHeader
  );
};

export const getSingleProfile: (
  PublicKeyBase58Check: string,
  Username?: string
) => Promise<ProfileAPIInterface> = async function (
  PublicKeyBase58Check: string,
  Username?: string
): Promise<ProfileAPIInterface> {
  return await axios.post(
    "https://api.bitclout.com/get-single-profile",
    JSON.stringify({
      PublicKeyBase58Check: PublicKeyBase58Check,
      Username: Username,
    }),
    bitcloutCfHeader
  );
};

export const getProfilePosts: (
  numToFetch: number,
  PublicKeyBase58Check: string,
  Username: string
) => Promise<PostsAPIInterface> = async function (
  numToFetch: number,
  PublicKeyBase58Check: string,
  Username: string
): Promise<PostsAPIInterface> {
  return await axios.post(
    "https://api.bitclout.com/get-posts-for-public-key",
    JSON.stringify({
      LastPostHashHex: "",
      NumToFetch: numToFetch,
      PublicKeyBase58Check: PublicKeyBase58Check,
      ReaderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
      Username: Username,
    }),
    bitcloutCfHeader
  );
};
