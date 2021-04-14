let mongoose,
  { Schema } = require("mongoose");

const listingSchema = new Schema({
  name: { type: String, unique: true, required: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: Schema.Types.ObjectId, ref: "User", default: null },
  saletype: { type: String, required: true },
  bitcloutamount: { type: Number, required: true },
  usdamount: { type: Number },
  etheramount: { type: Number },
  ongoing: { type: Boolean, default: false },
  escrow: {
    balance: { type: Number, default: 0 },
    full: { type: Boolean, default: false },
  },
  bitcloutsent: { type: Boolean },
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
