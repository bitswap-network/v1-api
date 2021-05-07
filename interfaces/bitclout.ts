import { AxiosResponse } from "axios"

export interface txnPreflightInterface {
  AmountNanos: number
  MinFeeRateNanosPerKB: number
  RecipientPublicKeyOrUsername: string
  SenderPublicKeyBase58Check: string | any
}

export interface TransactionAPIInterface extends AxiosResponse {
  data: {
    TotalInputNanos: number | undefined
    SpendAmountNanos: number | undefined
    ChangeAmountNanos: number | undefined
    FeeNanos: number | undefined
    TransactionIDBase58Check: string | undefined
    Transaction:
      | {
          TxInputs: TxnInputs
          TxOutputs: TxnOutput[]
          TxnMeta: any
          PublicKey: string
          ExtraData: any
          Signature: any
          TxnTypeJSON: any
        }
      | undefined
    TransactionHex: string | undefined
    TxnHashHex: string | undefined
    error: string | undefined
  }
}

export interface ProfileAPIInterface extends AxiosResponse {
  data: {
    Profile: bitcloutProfileType | undefined
    error: string | undefined
  }
}

export interface PostsAPIInterface extends AxiosResponse {
  data: {
    Posts: bitcloutPostType[] | undefined
    error: string | undefined
    LastPostHashHex: string | undefined
  }
}

export interface TxnInputs {
  TxID: number[]
  Index: number
}

export interface TxnOutput {
  PublicKey: string
  AmountNanos: number
}
export interface bitcloutProfileType {
  PublicKeyBase58Check: string
  Username: string
  Description: string
  ProfilePic: string
  IsHidden: boolean
  IsReserved: boolean
  IsVerified: boolean
  Comments: any
  Posts: null
  CoinEntry: any
  CoinPriceBitCloutNanos: number
  StakeMultipleBasisPoints: number | null
  StakeEntryStats: {
    TotalStakeNanos: number
    TotalStakeOwedNanos: number
    TotalCreatorEarningsNanos: number
    TotalFeesBurnedNanos: number
    TotalPostStakeNanos: number
  }
  UsersThatHODL: any
}

export interface bitcloutPostType {
  PostHashHex: string
  PosterPublicKeyBase58Check: string
  ParentStakeID: string
  Body: string
  ImageURLs: any | null
  RecloutedPostEntryResponse: bitcloutPostType
  CreatorBasisPoints: number
  StakeMultipleBasisPoints: number
  TimestampNanos: number
  IsHidden: boolean
  ConfirmationBlockHeight: number | null
  InMempool: boolean
  StakeEntry: {
    TotalPostStake: number
    StakeList: any[]
  }
  StakeEntryStats: {
    TotalStakeNanos: number
    TotalStakeOwedNanos: number
    TotalCreatorEarningsNanos: number
    TotalFeesBurnedNanos: number
    TotalPostStakeNanos: number
  }
  ProfileEntryResponse: any
  Comments: any
  LikeCount: number
  DiamondCount: number
  PostEntryReaderState: {
    LikedByReader: boolean
    DiamondLevelBestowed: number
    RecloutedByReader: boolean
    RecloutPostHashHex: string
  }
  InGlobalFeed: boolean
  IsPinned: boolean
  PostExtraData: any
  CommentCount: number
  RecloutCount: number
  ParentPosts: any
}
