import { model, Schema, Document } from "mongoose";

export interface transactionDoc extends Document {
  username: string;
  transactiontype: string;
  status: string;
  bitcloutnanos: number;
  bitcloutpubkey: string;
  created: Date;
  completed: Date;
  tx_id: string;
  fees: number;
}

const transactionSchema = new Schema<transactionDoc>({
  username: { type: String, required: true },
  bitcloutpubkey: { type: String },
  transactiontype: {
    type: String,
    required: true,
    enum: ["withdraw", "deposit"],
  },
  status: { type: String, required: true, enum: ["completed", "pending"] },
  bitcloutnanos: { type: Number, required: true },
  created: { type: Date, default: Date.now },
  completed: { type: Date },
  tx_id: { type: String },
  fees: { type: Number },
});

const Transaction = model<transactionDoc>("Transaction", transactionSchema);

export default Transaction;
