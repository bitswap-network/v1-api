import { model, Schema, Document } from "mongoose";

export interface transactionDoc extends Document {
  username: String;
  transactiontype: String;
  status: String;
  bitcloutvalue: Number;
  bitcloutid: String;
  created: Date;
  completed: Date;
}

const transactionSchema = new Schema<transactionDoc>({
  username: { type: String, required: true },
  bitcloutpubkey: { type: String },
  transactiontype: { type: String, required: true },
  status: { type: String, required: true },
  bitcloutvalue: { type: Number, required: true },
  created: { type: Date, default: Date.now() },
  completed: { type: Date },
});

const Transaction = model<transactionDoc>("Transaction", transactionSchema);

export default Transaction;
