import { AxiosResponse } from "axios";

export interface GetCoinHodlersInterface {
  PublicKeyBase58Check: string;
  FetchHodlings: boolean;
  FetchAll: boolean;
}

export interface GetCoinHodlersAPIInterface extends AxiosResponse {
  data: {
    Hodlers: Hodler[];
    LastPublicKeyBase58Check: string;
  };
}

interface Hodler {
  HODLerPublicKeyBase58Check: string;
  CreatorPublicKeyBase58Check: string;
  HasPurchased: boolean;
  BalanceNanos: number;
  NetBalanceInMempool: number;
  ProfileEntryResponse: BitcloutProfileType;
}

export interface TransferBitcloutBalanceInterface {
  SenderPrivateKeyBase58Check: string;
  RecipientPublicKeyBase58Check: string;
  AmountNanos: number;
  MinFeeRateNanosPerKB: number;
  DryRun: boolean;
}

export interface TransferBitcloutBalanceAPIInterface extends AxiosResponse {
  data: {
    TransactionInfo: {
      TotalInputNanos: number;
      SpendAmoutnNanos: number;
      ChangeAmountNanos: number;
      FeeNanos: number;
      FeeRateNanosPerKB: number;
      SenderPublicKeyBase58Check: string;
      RecipientPublicKeyBase58Check: string;
    };
    Transaction: {
      TransactionIDBase58Check: string;
      RawTransactionHex: string;
      Inputs: TBInputs[];
      Outputs: TBOutputs[];
      SignatureHex: string;
      TransactionType: number; //always 0 for basic transfer
      TransactionMeta: any; //always {} empty for basic transfer
      BlockHashHex: string;
    };
    Error: string;
  };
}

export interface TBOutputs {
  PublicKeyBase58Check: string;
  AmountNanos: number;
}

export interface TBInputs {
  TransactionIDBase58Check: string;
  Index: number;
}

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
