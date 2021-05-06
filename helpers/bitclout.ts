import axios from "axios";
import { AxiosResponse } from "axios";
import * as config from "./config";
import {
  ProfileAPIInterface,
  PostsAPIInterface,
  txnPreflightInterface,
  TransactionAPIInterface,
} from "../interfaces/bitclout";
import { generateHMAC } from "./functions";
const cfIngressCookie = {
  Cookie: `__cfduid=${config.cfuid}; INGRESSCOOKIE=${config.ingressCookie}`,
};
export const bitcloutCfHeader = {
  headers: {
    ...cfIngressCookie,
    "Content-Type": "application/json",
  },
};

export const preFlightSendBitclout: (
  transaction: txnPreflightInterface
) => Promise<TransactionAPIInterface> = async function (
  transaction: txnPreflightInterface
): Promise<TransactionAPIInterface> {
  return await axios.post(
    "https://api.bitclout.com/send-bitclout",
    JSON.stringify({ transaction }),
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

export const getFulfillmentLogs: (
  type: string,
  body: { id: string }
) => Promise<AxiosResponse> = async function (
  type: string,
  body: { id: string }
): Promise<AxiosResponse<any>> {
  return await axios.post(`${config.FULFILLMENT_API}/logs/${type}`, body, {
    headers: { "server-signature": generateHMAC(body) },
  });
};

export const manualFulfillment: (body: {
  listing_id: string;
}) => Promise<AxiosResponse> = async function (body: {
  listing_id: string;
}): Promise<AxiosResponse<any>> {
  return await axios.post(`${config.FULFILLMENT_API}/webhook/retry`, body, {
    headers: { "server-signature": generateHMAC(body) },
  });
};

export const handleWithdraw: (body: {
  username: string;
  txn_id: string;
}) => Promise<AxiosResponse> = async function (body: {
  username: string;
  txn_id: string;
}): Promise<AxiosResponse<any>> {
  return await axios.post(`${config.FULFILLMENT_API}/core/withdraw`, body, {
    headers: { "server-signature": generateHMAC(body) },
  });
};
