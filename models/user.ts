import { model, Schema, Document } from "mongoose";
export interface UserDoc extends Document {
  name: string;
  email: string;
  balance: {
    bitclout: number;
    ether: number;
    in_transaction: boolean | undefined;
  };
  transactions: Schema.Types.ObjectId[];
  verification: {
    email: boolean;
    emailString: string;
    status: string;
    bitcloutString: string;
  };
  bitclout: {
    publicKey: string;
    bio: string | undefined;
    verified: boolean;
    profilePicture: string | undefined;
    username: string;
  };
  created: Date;
  admin: boolean;
}

const userSchema = new Schema<UserDoc>({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  balance: {
    bitclout: { type: Number, default: 0, required: true },
    ether: { type: Number, default: 0, required: true },
    in_transaction: { type: Boolean, default: false },
  },
  transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
  verification: {
    email: { type: Boolean, default: false },
    emailString: { type: String },
    status: {
      type: String,
      default: "unverified",
      enum: ["unverified", "verified"],
    },
    bitcloutString: { type: String },
  },
  bitclout: {
    publicKey: { type: String, unique: true, required: true },
    bio: { type: String },
    verified: { type: Boolean, default: false },
    profilePicture: { type: String },
    username: {
      type: String,
      unique: true,
    },
  },
  created: {
    type: Date,
    default: Date.now,
  },
  admin: { type: Boolean, default: false },
});

const User = model<UserDoc>("User", userSchema);
export default User;
