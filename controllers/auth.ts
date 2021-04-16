import { generateAccessToken, generateCode } from "../utils/functions";
var ExpressBrute = require("express-brute");
var MongooseStore = require("express-brute-mongoose");
var BruteForceSchema = require("express-brute-mongoose/dist/schema");
const mongoose = require("mongoose");
const authRouter = require("express").Router();
import User from "../models/user";
const sendMail = require("../utils/mailer");
const bcrypt = require("bcrypt");

var bruteforce_model = mongoose.model(
  "bruteforce",
  new mongoose.Schema(BruteForceSchema)
);
var store = new MongooseStore(bruteforce_model);
var bruteforce = new ExpressBrute(store);

authRouter.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).send("Missing fields in request body");
  } else {
    const newUser = new User({
      username: username,
      email: email,
    });
    newUser.password = bcrypt.hashSync(password, 8);
    const code = generateCode();
    newUser.emailverification = code;
    newUser
      .save()
      .then(() => {
        sendMail(
          email,
          "Verify your BitSwap email",
          `Click <a href="https://api.bitswap.network/user/verifyemail/${code}">here</a> to verify your email. If this wasn't you, simply ignore this email.`
        );
      })
      .then(() => {
        res.status(201).send("Registration successful");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

authRouter.post("/login", bruteforce.prevent, (req, res) => {
  const { username, password } = req.body;
  const token = generateAccessToken({ username: username });
  User.findOne(
    {
      $or: [{ username: username }, { email: username }],
    },
    function (err, user) {
      if (err) {
        res.status(500).send(err);
      } else if (!user.validPassword(password)) {
        res.status(400).send("Invalid username or password");
      } else if (!user.emailverified) {
        res.status(403).send("Email not verified");
      } else {
        user.token = token;
        res.status(200).json({
          ...user,
          token: token,
        });
      }
    }
  );
});

export default authRouter;
