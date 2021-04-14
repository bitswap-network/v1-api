import { Schema } from "mongoose";

const listingSchema = new Schema({
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

export default listingSchema;
