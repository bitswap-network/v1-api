const mongoose = require("mongoose");
const { Schema } = mongoose;
var bcrypt = require("bcrypt-nodejs");

mongoose.connect(process.env.MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error: "));

db.once("open", function () {
  console.log("connected to database");
});

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

const listingSchema = new Schema({
  name: { type: String, unique: true, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  saletype: { type: String, required: true },
  bitcloutamount: { type: Number, required: true },
  usdamount: { type: Number },
  etheramount: { type: Number },
  ongoing: { type: Boolean, default: false },
  escrow: {
    balance: { type: Number, default: 0 },
    full: { type: Boolean, default: false },
  },
  bitcloutsent: { type: Boolean },
  bitcloutTransactionId: { type: String, default: "" },
  finalTransactionId: { type: String, default: "" },
  created: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Date,
  },
});

userSchema.methods.generateHash = function (password: String) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password: String) {
  return bcrypt.compareSync(password, this.password);
};
const User = mongoose.model("User", userSchema);
const Listing = mongoose.model("Listing", listingSchema);

export { User, Listing };
