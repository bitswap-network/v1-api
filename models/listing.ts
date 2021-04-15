import { model, Schema, Document } from "mongoose";

export interface listingDoc extends Document{
  name: String,
  seller: Schema.Types.ObjectId,
  buyer:Schema.Types.ObjectId,
  listingtype:String,
  currencysaletype:{},
  bitcloutamount:Number,
  usdamount:Number,
  etheramount:Number,
  ongoing:Boolean,
  escrow:{balance:Number,full:Boolean},
  bitcloutrecieved:Boolean,
  bitcloutsent:Boolean,
  bitcloutrTransactionId:String,
  finalTransactionId:String,
  created:Date,
  completed:Date
}

const listingSchema = new Schema<listingDoc>({
  name: { type: String, unique: true, required: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: Schema.Types.ObjectId, ref: "User", default: null },
  listingtype: { type: String, required: true },
  currencysaletype: { type: String, required: true },
  bitcloutamount: { type: Number, required: true },
  usdamount: { type: Number },
  etheramount: { type: Number },
  ongoing: { type: Boolean, default: false },
  escrow: {
    balance: { type: Number, default: 0 },
    full: { type: Boolean, default: false },
  },
  bitcloutreceieved: { type: Boolean, default: false },
  bitcloutsent: { type: Boolean, default: true },
  bitcloutTransactionId: { type: String, default: "" },
  finalTransactionId: { type: String, default: "" },
  created: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Date,
  },
});
const Listing = model<listingDoc>("Listing", listingSchema);

export default Listing;
