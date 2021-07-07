import { AxiosResponse } from "axios";

export interface GetKeyPairInterface {
  Mnemonic: string;
  ExtraText: string;
  Index: number;
}

export interface SubmitTransactionInterface {
  TransactionHex: string;
}

export interface TxnPreflightInterface {
  AmountNanos: number;
  MinFeeRateNanosPerKB: number;
  RecipientPublicKeyOrUsername: string | any;
  SenderPublicKeyBase58Check: string | any;
}

export interface GetKeyPairAPIInterface extends AxiosResponse {
  data: {
    PublicKeyBase58Check: string;
    PublicKeyHex: string;
    PrivateKeyBase58Check: string;
    PrivateKeyHex: string;
    Error: string;
  };
}

export interface SubmitTransactionAPIInterface extends AxiosResponse {
  data: {
    PostEntryResponse: any;
    Transaction: any;
    TxnHashHex: string | undefined;
    error: string | undefined;
  };
}

export interface TransactionAPIInterface extends AxiosResponse {
  data: {
    TotalInputNanos: number;
    SpendAmountNanos: number;
    ChangeAmountNanos: number;
    FeeNanos: number;
    TransactionIDBase58Check: string;
    Transaction:
      | {
          TxInputs: TxnInputs;
          TxOutputs: TxnOutput[];
          TxnMeta: any;
          PublicKey: string;
          ExtraData: any;
          Signature: any;
          TxnTypeJSON: any;
        }
      | undefined;
    TransactionHex: string;
    TxnHashHex: string | undefined;
    error: string | undefined;
  };
}
export interface ExchangeRateAPIInterface extends AxiosResponse {
  data: {
    NanosSold: number;
    SatoshisPerBitCloutExchangeRate: number;
    USDCentsPerBitcoinExchangeRate: number;
    error: string | undefined;
  };
}
export interface ProfileAPIInterface extends AxiosResponse {
  data: {
    Profile: BitcloutProfileType;
    error: string | undefined;
  };
}

export interface TxnInputs {
  TxID: number[];
  Index: number | undefined;
}

export interface TxnOutput {
  PublicKey: string;
  AmountNanos: number;
}
export interface BitcloutProfileType {
  PublicKeyBase58Check: string;
  Username: string;
  Description: string;
  ProfilePic: string;
  IsHidden: boolean;
  IsReserved: boolean;
  IsVerified: boolean;
  Comments: any;
  Posts: null;
  CoinEntry: any;
  CoinPriceBitCloutNanos: number;
  StakeMultipleBasisPoints: number | null;
  StakeEntryStats: {
    TotalStakeNanos: number;
    TotalStakeOwedNanos: number;
    TotalCreatorEarningsNanos: number;
    TotalFeesBurnedNanos: number;
    TotalPostStakeNanos: number;
  };
  UsersThatHODL: any;
}
