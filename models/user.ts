import { model, Schema, Document } from "mongoose";
const bcrypt = require("bcrypt-nodejs");

export interface UserDoc extends Document {
  name: string;
  username: string;
  email: string;
  emailverified: boolean;
  emailverification: string;
  bitcloutpubkey: string;
  ethereumaddress: string;
  password: string;
  passwordverification: string;
  created: Date;
  listings: [Schema.Types.ObjectId];
  buys: [Schema.Types.ObjectId];
  admin: boolean;
  verified: string;
  ratings: [{ rating: number; rater: Schema.Types.ObjectId }];
  completedtransactions: number;
  generateHash: (password: string) => boolean;
  validPassword: (password: string) => boolean;
  bitswapbalance: number;
}

const userSchema = new Schema<UserDoc>({
  name: { type: String },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  emailverified: { type: Boolean, default: false },
  emailverification: { type: String },
  bitcloutpubkey: { type: String, unique: true },
  ethereumaddress: { type: String, unique: true },
  password: { type: String, required: true },
  passwordverification: { type: String },
  incomplete: { type: Boolean, required: true, default: true },
  created: {
    type: Date,
    default: Date.now,
  },
  listings: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  buys: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  admin: { type: Boolean, default: false },
  verified: {
    type: String,
    default: "unverified",
    enum: ["unverified", "pending", "verified"],
  },
  ratings: [
    {
      rating: {
        type: Number,
        rater: { type: Schema.Types.ObjectId, ref: "User" },
      },
    },
  ],
  completedorders: { type: Number, default: 0 },
  bitswapbalance: { type: Number, default: 0 },
  transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
});

// userSchema.set("toJSON", {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     delete returnedObject._id;
//     delete returnedObject.__v;
//   },
// });

userSchema.methods.generateHash = function (password: String) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password: String) {
  return bcrypt.compareSync(password, this.password);
};

const User = model<UserDoc>("User", userSchema);
export default User;
