export interface AddressActivity {
  category: string;
  blockNum: string;
  fromAddress: string;
  toAddress: string | null;
  value: number | null;
  erc721TokenId: string | null;
  asset: string | null;
  hash: string;
  rawContract: {
    value: string | null;
    address: string | null;
    decimal: string | null;
  };
  typeTraceAddress: string | null;
}
