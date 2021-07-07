import {model, Schema, Document} from "mongoose";
export interface UserDoc extends Document {
  name: string;
  email: string;
  balance: {
    bitclout: number;
    ether: number;
    usdc: number;
    in_transaction: boolean;
  };
  transactions: Schema.Types.ObjectId[];
  verification: {
    email: boolean;
    emailString: string;
    personaAccountId: string | null;
    inquiryId: string | null;
    personaVerified: boolean;
  };
  bitclout: {
    publicKey: string;
    bio: string | undefined;
    verified: boolean;
    username: string | undefined;
  };
  tier: number;
  created: Date;
  admin: boolean;
}

const userSchema = new Schema<UserDoc>({
  name: {type: String},
  email: {type: String, unique: true, required: true},
  balance: {
    usdc: {type: Number, default: 0, required: true},
    bitclout: {type: Number, default: 0, required: true},
    ether: {type: Number, default: 0, required: true},
    in_transaction: {type: Boolean, default: false},
  },
  transactions: [{type: Schema.Types.ObjectId, ref: "Transaction"}],
  verification: {
    email: {type: Boolean, default: false},
    emailString: {type: String},
    personaAccountId: {type: String, default: null},
    inquiryId: {type: String, default: null},
    personaVerified: {type: Boolean, default: false},
  },
  bitclout: {
    publicKey: {type: String, unique: true, required: true},
    bio: {type: String},
    verified: {type: Boolean, default: false},
    username: {
      type: String,
      unique: true,
    },
  },
  tier: {type: Number, required: true, default: 0},
  created: {
    type: Date,
    default: Date.now,
  },
  admin: {type: Boolean, default: false},
});

const User = model<UserDoc>("User", userSchema);
export default User;
