import { generateAccessToken, generateCode } from "../utils/functions";

const authRouter = require("express").Router();
const User = require("../models/user");
const sendMail = require("../utils/mailer");

authRouter.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).send("Missing fields in request body");
  } else {
    const newUser = new User({
      username: username,
      email: email,
    });
    newUser.password = newUser.generateHash(password);
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

authRouter.post("/login", (req, res) => {
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
