import { model, Schema, Document } from "mongoose";

export interface poolDoc extends Document {
  address: string;
  hashedKey: string;
  active: boolean;
  activeStart: number | null;
  user: Schema.Types.ObjectId | null;
  super: number;
  balance: {
    ETH: number;
    USDC: number;
    updatedToInt: boolean;
  };
  txnHashList: string[];
}

const poolSchema = new Schema<poolDoc>({
  address: { type: String, required: true, unique: true },
  hashedKey: { type: String, required: true, unique: true },
  active: { type: Boolean, default: false },
  activeStart: { type: Number, default: null },
  user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  super: { type: Number, default: 1 },
  balance: {
    ETH: { type: Number, default: 0 },
    USDC: { type: Number, default: 0 },
    updatedToInt: { type: Boolean, default: true },
  },
  txnHashList: [{ type: String }],
});
const Pool = model<poolDoc>("Pool", poolSchema);

export default Pool;
