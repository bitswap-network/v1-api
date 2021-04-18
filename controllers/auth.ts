import { generateAccessToken, generateCode } from "../utils/functions";

const authRouter = require("express").Router();
import User from "../models/user";
import sendMail from "../utils/mailer";
import { bruteforce } from "../utils/middleware";


authRouter.post("/register", bruteforce.prevent, async (req, res) => {
  const {
    username,
    email,
    password,
    bitcloutpubkey,
    ethereumaddress,
  } = req.body;
  if (!username || !email || !password || !bitcloutpubkey || !ethereumaddress) {
    res.status(400).send("Missing fields in request body");
  } else if (password.length < 8) {
    res.status(400).send("Password formatting error");
  } else {
    const user = await User.findOne({$or: [{ username: username }, { email: username }, {bitcloutpubkey: bitcloutpubkey}, {ethereumaddress: ethereumaddress}] }).exec();
    if (user) {
      res.status(409).send("There is already a user with that information")
    } else {
      const newUser = new User({
        username: username,
        email: email,
        bitcloutpubkey: bitcloutpubkey,
        ethereumaddress: ethereumaddress.toLowerCase(),
      });
      newUser.password = newUser.generateHash(password);
      const code = generateCode();
      newUser.emailverification = code;
      newUser.save((err: any) => {
        if (err) {
          res.status(500).send(err);
        } else {
          try {
            sendMail(
              email,
              "Verify your BitSwap email",
              `<!DOCTYPE html><html><head><title>BitSwap Email Verification</title><body>` +
                `<p>Click <a href="https://api.bitswap.network/user/verifyemail/${code}">here</a> to verify your email. If this wasn't you, simply ignore this email.` +
                `</body></html>`
            );
            res.status(201).send("Registration successful");
          } catch (err) {
            res.status(500).send(err);
          }
        }
      });
    }
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
      } else if (!user) {
        res.status(404).send("A user with that email or password doesn't exist!")
      } else if (!user.validPassword(password)) {
        res.status(400).send("Invalid username or password");
      } else if (!user.emailverified) {
        res.status(403).send("Email not verified");
      } else {
        // user.token = token;
        res.json({
          user,
          token: token,
        });
      }
    }
  );
});

export default authRouter;
