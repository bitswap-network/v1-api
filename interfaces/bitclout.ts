import { AxiosResponse } from "axios";

export interface submitTransactionInterface {
  TransactionHex: string;
}

export interface txnPreflightInterface {
  AmountNanos: number;
  MinFeeRateNanosPerKB: number;
  RecipientPublicKeyOrUsername: string | any;
  SenderPublicKeyBase58Check: string | any;
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

export interface UsersStatelessAPIInterface extends AxiosResponse {
  data: {
    UserList: {
      PublicKeyBase58Check: string;
      ProfileEntryResponse: bitcloutProfileType;
      Utxos: undefined;
      BalanceNanos: number;
      UnminedBalanceNanos: number;
      PublicKeysBase58CheckFollowedByUser: string[];
      UsersYouHODL: UserYouHODL[];
      UsersWhoHODLYou: undefined;
      HasPhoneNumber: boolean;
      CanCreateProfile: boolean;
      BlockedPubKeys: undefined;
      IsAdmin: boolean;
      IsBlacklisted: boolean;
      IsGraylisted: boolean;
    }[];
    DefaultFeeRateNanosPerKB: number;
    ParamUpdaters: {
      string: boolean;
    };
  };
}

export interface UserYouHODL extends AxiosResponse {
  data: {
    HODLerPublicKeyBase58Check: string;
    CreatorPublicKeyBase58Check: string;
    HasPurchased: boolean;
    BalanceNanos: number;
    NetBalanceInMempool: number;
    ProfileEntryResponse: {
      PublicKeyBase58Check: string;
      Username: string;
      Description: string;
      IsHidden: boolean;
      IsReserved: boolean;
      IsVerified: boolean;
      Comments: undefined;
      Posts: undefined;
      CoinEntry: {
        CreatorBasisPoints: number;
        BitCloutLockedNanos: number;
        NumberOfHolders: number;
        CoinsInCirculationNanos: number;
        CoinWatermarkNanos: number;
      };
      CoinPriceBitCloutNanos: number;
      StakeMultipleBasisPoints: number;
      StakeEntryStats: {
        TotalStakeNanos: number;
        TotalStakeOwedNanos: number;
        TotalCreatorEarningsNanos: number;
        TotalFeesBurnedNanos: number;
        TotalPostStakeNanos: number;
      };
      UsersThatHODL: undefined;
    };
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
    Profile: bitcloutProfileType | undefined;
    error: string | undefined;
  };
}

export interface PostsAPIInterface extends AxiosResponse {
  data: {
    Posts: bitcloutPostType[] | undefined;
    error: string | undefined;
    LastPostHashHex: string | undefined;
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
export interface bitcloutProfileType {
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

export interface bitcloutPostType {
  PostHashHex: string;
  PosterPublicKeyBase58Check: string;
  ParentStakeID: string;
  Body: string;
  ImageURLs: any | null;
  RecloutedPostEntryResponse: bitcloutPostType;
  CreatorBasisPoints: number;
  StakeMultipleBasisPoints: number;
  TimestampNanos: number;
  IsHidden: boolean;
  ConfirmationBlockHeight: number | null;
  InMempool: boolean;
  StakeEntry: {
    TotalPostStake: number;
    StakeList: any[];
  };
  StakeEntryStats: {
    TotalStakeNanos: number;
    TotalStakeOwedNanos: number;
    TotalCreatorEarningsNanos: number;
    TotalFeesBurnedNanos: number;
    TotalPostStakeNanos: number;
  };
  ProfileEntryResponse: any;
  Comments: any;
  LikeCount: number;
  DiamondCount: number;
  PostEntryReaderState: {
    LikedByReader: boolean;
    DiamondLevelBestowed: number;
    RecloutedByReader: boolean;
    RecloutPostHashHex: string;
  };
  InGlobalFeed: boolean;
  IsPinned: boolean;
  PostExtraData: any;
  CommentCount: number;
  RecloutCount: number;
  ParentPosts: any;
}
