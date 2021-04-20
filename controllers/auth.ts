import { generateAccessToken, generateCode } from "../utils/functions";

const authRouter = require("express").Router();
import User from "../models/user";
import sendMail from "../utils/mailer";
import { bruteforce, tokenAuthenticator } from "../utils/middleware";

authRouter.post("/register", bruteforce.prevent, async (req, res) => {
  const {
    username,
    email,
    password,
    bitcloutpubkey,
    ethereumaddress,
  } = req.body;
  if (!username || !email || !password || !bitcloutpubkey || !ethereumaddress) {
    res.status(400).send({ message: "Missing fields in request body" });
  } else if (password.length < 8) {
    res.status(400).send({ message: "Password formatting error" });
  } else {
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { bitcloutpubkey: bitcloutpubkey },
        { ethereumaddress: ethereumaddress },
      ],
    }).exec();
    if (user) {
      res
        .status(409)
        .send({ message: "There is already a user with that information" });
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
        res.status(500).send({ error: "An error occurred on the server" });
      } else if (!user) {
        res
          .status(404)
          .send({ error: "A user with that email or password doesn't exist!" });
      } else if (!user.validPassword(password)) {
        res.status(400).send({ error: "Invalid username or password" });
      } else if (!user.emailverified) {
        res.status(403).send({ error: "Email not verified" });
      } else {
        res.json({
          admin: user.admin,
          bitcloutpubkey: user.bitcloutpubkey,
          bitswapbalance: user.bitswapbalance,
          buys: user.buys,
          buystate: user.buystate,
          completedorders: user.completedorders,
          created: user.created,
          email: user.email,
          emailverified: user.emailverified,
          ethereumaddress: user.ethereumaddress,
          listings: user.listings,
          ratings: user.ratings,
          transactions: user.transactions,
          username: user.username,
          verified: user.verified,
          token: token,
          _id: user._id,
        });
      }
    }
  );
});

authRouter.get("/verifytoken", tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
