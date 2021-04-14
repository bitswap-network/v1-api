import { model, Schema, Document } from "mongoose";
const bcrypt = require("bcrypt-nodejs");

interface User extends Document {
  name: string;
  username: string;
  email: string;
  emailverified: boolean;
  emailverification: string;
  bitcloutpubkey: string;
  ethereumaddress: string;
  password: string;
  created: Date;
  listings: [];
}

const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  emailverified: { type: Boolean, default: false },
  emailverification: { type: String },
  bitcloutpubkey: { type: String, unique: true, required: true },
  ethereumaddress: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  created: {
    type: Date,
    default: Date.now,
  },
  listings: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  admin: { type: Boolean, default: false },
  verified: { type: String, default: "unverified" },
  ratings: [
    {
      rating: {
        type: Number,
        rater: { type: Schema.Types.ObjectId, ref: "User" },
      },
    },
  ],
  completedtransactions: { type: Number, default: 0 },
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

userSchema.methods.generateHash = function (password: String) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password: String) {
  return bcrypt.compareSync(password, this.password);
};

const User = model("User", userSchema);
export default User;
