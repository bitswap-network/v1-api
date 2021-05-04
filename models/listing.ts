import { model, Schema, Document } from "mongoose";
export interface listingDoc extends Document {
  seller: Schema.Types.ObjectId;
  buyer: Schema.Types.ObjectId | null;
  currencysaletype: string;
  bitcloutnanos: number;
  usdamount: number;
  etheramount: number;
  ongoing: boolean;
  escrow: { balance: number; full: Boolean };
  bitcloutsent: boolean;
  escrowsent: boolean;
  finalTransactionId: string;
  created: Date;
  buy_time: Date | null;
  completed: { status: boolean; date: Date };
  ethaddress: string;
  pool: Schema.Types.ObjectId | null;
}

const listingSchema = new Schema<listingDoc>({
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: Schema.Types.ObjectId, ref: "User", default: null },
  currencysaletype: { type: String, required: true, enum: ["ETH", "USD"] },
  bitcloutnanos: { type: Number, required: true },
  usdamount: { type: Number },
  etheramount: { type: Number },
  ongoing: { type: Boolean, default: false },
  escrow: {
    balance: { type: Number, default: 0 },
    full: { type: Boolean, default: false },
  },
  bitcloutsent: { type: Boolean, default: false },
  escrowsent: { type: Boolean, default: false },
  finalTransactionId: { type: String, default: "" },
  created: {
    type: Date,
    default: Date.now,
  },
  buy_time: { type: Date, default: null },
  completed: {
    status: { type: Boolean, default: false },
    date: { type: Date },
  },
  ethaddress: { type: String },
  pool: { type: Schema.Types.ObjectId, ref: "Pool", default: null },
});
const Listing = model<listingDoc>("Listing", listingSchema);

export default Listing;
