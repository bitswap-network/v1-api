import { model, Schema, Document } from "mongoose";
import { transactionDoc } from "./transaction";
const bcrypt = require("bcrypt");

export interface UserDoc extends Document {
  generateHash(password: string): string;
  validPassword(password: string): string;
  username: string;
  email: string;
  password: string;
  balance: {
    bitclout: number;
    ether: number;
  };
  onGoingDeposit: transactionDoc | null;
  transactions: Schema.Types.ObjectId[];
  verification: {
    email: boolean;
    emailString: string;
    passwordString: string;
    status: string;
    bitcloutString: string;
  };
  bitclout: {
    publicKey: string;
    bio: string | undefined;
    verified: boolean;
    profilePicture: string | undefined;
  };
  created: Date;
  admin: boolean;
}

const userSchema = new Schema<UserDoc>({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  balance: {
    bitclout: { type: Number, default: 0, required: true },
    ether: { type: Number, default: 0, required: true }
  },
  onGoingDeposit: {
    type: Schema.Types.ObjectId,
    ref: "Transaction",
    default: null
  },
  transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
  verification: {
    email: { type: Boolean, default: false },
    emailString: { type: String },
    passwordString: { type: String },
    status: {
      type: String,
      default: "unverified",
      enum: ["unverified", "pending", "verified"]
    },
    bitcloutString: { type: String }
  },
  bitclout: {
    publicKey: { type: String, unique: true },
    bio: { type: String },
    verified: { type: Boolean, default: false },
    profilePicture: { type: String }
  },
  created: {
    type: Date,
    default: Date.now
  },
  admin: { type: Boolean, default: false }
});

userSchema.methods.generateHash = function (password: String) {
  return bcrypt.hashSync(password, 8);
};

userSchema.methods.validPassword = function (password: String) {
  return bcrypt.compareSync(password, this.password);
};

const User = model<UserDoc>("User", userSchema);
export default User;
