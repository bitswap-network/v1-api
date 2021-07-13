import { model, Schema, Document } from "mongoose";
export interface transactionDoc extends Document {
  user: Schema.Types.ObjectId;
  transactionType: string;
  assetType: string;
  value: number;
  usdValueAtTime: number;
  created: Date;
  completed: boolean;
  completionDate: Date | undefined;
  state: string;
  error: string | null;
  poolAddress: string | undefined;
  gasPrice: number | undefined;
  txnHash: string | undefined;
}

const transactionSchema = new Schema<transactionDoc>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  transactionType: {
    type: String,
    required: true,
    enum: ["withdraw", "deposit"],
  },
  assetType: { type: String, required: true, enum: ["ETH", "BCLT"] },
  value: { type: Number, required: true, default: 0 },
  usdValueAtTime: { type: Number, default: 0 },
  created: { type: Date },
  completed: { type: Boolean, required: true, default: false },
  completionDate: { type: Date },
  state: {
    type: String,
    required: true,
    default: "pending",
    enum: ["pending", "done", "failed"],
  },
  error: { type: String, default: null },
  poolAddress: { type: String },
  gasPrice: { type: Number },
  txnHash: { type: String },
});

const Transaction = model<transactionDoc>("Transaction", transactionSchema);

export default Transaction;
