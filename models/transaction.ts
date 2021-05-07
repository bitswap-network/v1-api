import { model, Schema, Document } from "mongoose";
import { UserDoc } from "./user";
export interface transactionDoc extends Document {
  user: UserDoc;
  transactionType: string;
  assetType: string;
  value: number;
  created: Date;
  completed: boolean;
  completionDate: Date | undefined;
  state: string;
  error: string | null;
  gasDeducted: number | undefined;
  txnHash: string | undefined;
}

const transactionSchema = new Schema<transactionDoc>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  transactionType: {
    type: String,
    required: true,
    enum: ["withdraw", "deposit"]
  },
  assetType: { type: String, required: true, enum: ["ETH", "BCLT"] },
  value: { type: Number, required: true },
  created: { type: Date, default: Date.now },
  completed: { type: Boolean, required: true, default: false },
  completionDate: { type: Date },
  state: {
    type: String,
    required: true,
    default: "pending",
    enum: ["pending", "done", "failed"]
  },
  error: { type: String, default: null },
  gasDeducted: { type: Number },
  txnHash: { type: String }
});

const Transaction = model<transactionDoc>("Transaction", transactionSchema);

export default Transaction;
