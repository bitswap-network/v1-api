import * as config from "../utils/config";
import axios, { AxiosResponse } from "axios";
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(config.HttpProvider));

export const checkEthAddr = async (address: string) => {
  return web3.utils.isAddress(address);
};

export const genWallet = async () => {
  return web3.eth.accounts.create();
};
export const addAddressWebhook: (
  address: string[]
) => Promise<AxiosResponse> = async function (
  address: string[]
): Promise<AxiosResponse<any>> {
  return await axios.patch(
    "https://dashboard.alchemyapi.io/api/update-webhook-addresses",
    {
      webhook_id: config.WEBHOOK_ID,
      addresses_to_add: address,
      addresses_to_remove: [],
    },
    {
      headers: { "X-Alchemy-Token": config.XAlchemyToken },
    }
  );
};

export const getNonce = async (address: string) => {
  return web3.eth.getTransactionCount(address, "pending");
};
