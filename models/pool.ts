import { model, Schema, Document } from "mongoose";

export interface poolDoc extends Document {
  address: string;
  privateKey: {
    salt: string;
    encryptedKey: string;
  };
  active: boolean;
  user: Schema.Types.ObjectId | null;
  super: number;
  balance: number;
}

const poolSchema = new Schema<poolDoc>({
  address: { type: String, required: true, unique: true },
  privateKey: {
    salt: { type: String, required: true, unique: true },
    encryptedKey: { type: String, required: true, unique: true },
  },
  active: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  super: { type: Number, default: 1 },
  balance: { type: Number, default: 0 },
});
const Pool = model<poolDoc>("Pool", poolSchema);

export default Pool;
