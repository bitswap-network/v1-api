import * as config from "../config";
import axios, {AxiosResponse} from "axios";
const EthereumTx = require("ethereumjs-tx").Transaction;
import {createAlchemyWeb3} from "@alch/alchemy-web3";
export const web3 = createAlchemyWeb3(config.WSProvider ? config.WSProvider : "");

export const getEthBalance = async (address: string) => {
  return web3.utils.fromWei(await web3.eth.getBalance(address), "ether");
};

export const getUSDCBalance = async (address: string) => {
  return new Promise<number>((resolve, reject) => {
    axios
      .post(config.HTTPProvider, {
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [address, ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]],
        id: 42,
      })
      .then(response => {
        const balance = response.data.result.tokenBalances[0].tokenBalance;
        if (balance === "0x") {
          resolve(0);
        } else {
          resolve(parseInt(balance) / 1e6);
        }
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const checkEthAddr = async (address: string) => {
  return web3.utils.isAddress(address.toLowerCase());
};

export const genWallet = async () => {
  return web3.eth.accounts.create();
};

export const addAddressWebhook: (address: string[]) => Promise<AxiosResponse> = async function (
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
      headers: {"X-Alchemy-Token": config.XAlchemyToken},
    }
  );
};

export const getNonce = async (address: string) => {
  return web3.eth.getTransactionCount(address, "pending");
};

export const sendEth = async (
  priv_key: string,
  from_address: string,
  to_address: string,
  value: number,
  nonce: number,
  gasprice: number
) => {
  const rawTx = {
    to: to_address,
    from: from_address,
    value: web3.utils.toHex(web3.utils.toWei((value - (21000 * gasprice) / 1e9).toString())),
    gasLimit: web3.utils.toHex(21000),
    gasPrice: web3.utils.toHex(web3.utils.toWei(gasprice.toString(), "gwei")),
    nonce: web3.utils.toHex(nonce),
  };

  const transaction = new EthereumTx(rawTx, {
    chain: config.NETWORK,
  });
  transaction.sign(web3.utils.hexToBytes(priv_key));
  const serializedTransaction = transaction.serialize();

  return web3.eth.sendSignedTransaction("0x" + serializedTransaction.toString("hex"));
};
