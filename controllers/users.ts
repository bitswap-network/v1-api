const userRouter = require("express").Router();
import User from "../models/user";
const { tokenAuthenticator } = require("../utils/middleware");
import sendMail, {
  emailverified,
  invalidlink,
  servererror,
} from "../utils/mailer";
import Transaction from "../models/transaction";
import { generateCode } from "../utils/functions";
import proxy from "../utils/proxy";
const config = require("../utils/config");
import axios from "axios";
userRouter.get("/profile/:username", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
  }).exec();
  if (user) {
    // Get bio and profile picture from Bitclout API
    res.status(200).json(user);
  } else {
    res.status(404).send("User not found");
  }
});

userRouter.put("/updateprofile", tokenAuthenticator, async (req, res) => {
  const { name, email, ethereumaddress, bitcloutpubkey } = req.body;
  await User.updateOne(
    {
      username: req.user.username,
    },
    {
      email: email.toLowerCase(),
      bitcloutpubkey: bitcloutpubkey,
      ethereumaddress: ethereumaddress.toLowerCase(),
      name: name,
    },
    {},
    (err: any, doc: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send("Profile successfully updated");
      }
    }
  );
});

userRouter.post("/updatepassword", tokenAuthenticator, async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  if (oldpassword && newpassword) {
    const user = await User.findOne({ username: req.user.username }).exec();
    if (user && user.validPassword(oldpassword) && newpassword.length >= 8) {
      user.password = user.generateHash(newpassword);
      user.save((err: any) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(201).send("Password successfully updated");
        }
      });
    } else {
      res.status(400).send("Invalid password");
    }
  } else {
    res.status(400).send("Missing fields");
  }
});

userRouter.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email }).exec();
  if (user) {
    const code = generateCode();
    user.passwordverification = code;
    user
      .save()
      .then(() => {
        sendMail(
          email,
          "Reset your BitSwap password",
          `<!DOCTYPE html><html><head><title>BitSwap Password Reset</title><body>` +
            `<p>Click <a href="https://api.bitswap.network/user/verifypassword/${code}">here</a> to reset your password. If you didn't request a password change, simply ignore this email.` +
            `</body></html>`
        );
      })
      .then(() => {
        res.status(200).send("Email successfully sent");
      })
      .catch((error) => {
        res.status(500).send("An error occurred:", error);
      });
  } else {
    res.status(404).send("A user with that email could not be found");
  }
});

userRouter.get("/verifyemail/:code", async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ emailverification: code }).exec();
  if (user) {
    user.emailverified = true;
    user.emailverification = "";
    user
      .save()
      .then(() => {
        res.status(200).send(emailverified);
      })
      .catch((error) => {
        res.status(500).send(servererror);
      });
  } else {
    res.status(404).send(invalidlink);
  }
});

userRouter.get("/verifypassword/:code", async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ passwordverification: code }).exec();
  if (user) {
    const password = generateCode();
    user.password = user.generateHash(password);
    user.passwordverification = "";
    user
      .save()
      .then(() => {
        res
          .status(200)
          .send(
            `<!DOCTYPE html><html><body><p>Your password has been reset. Your temporary password is "${password}" (no quotation marks).</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>`
          );
      })
      .catch((error) => {
        res.status(500).send(servererror);
      });
  } else {
    res.status(404).send(invalidlink);
  }
});

userRouter.post("/deposit", tokenAuthenticator, async (req, res) => {
  const { bitcloutpubkey, bitcloutvalue } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    const transaction = new Transaction({
      username: req.user.username,
      bitcloutpubkey: bitcloutpubkey,
      transactiontype: "deposit",
      status: "pending",
      bitcloutnanos: bitcloutvalue * 1e9,
    });
    transaction.save((err: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        user.transactions.push(transaction._id);
        user.save((err: any) => {
          if (err) {
            res.status(500).send(err);
          } else {
            res.status(200).send(transaction);
          }
        });
      }
    });
  } else {
    res.status(400).send("user not found");
  }
});

userRouter.post("/withdraw", tokenAuthenticator, async (req, res) => {
  const { username, bitcloutpubkey, bitcloutnanos } = req.body;
  const user = await User.findOne({ username: username }).exec();
  if (user) {
    if (bitcloutnanos <= user.bitswapbalance) {
      const transaction = new Transaction({
        username: username,
        bitcloutpubkey: bitcloutpubkey,
        transactiontype: "withdraw",
        status: "pending",
        bitcloutvalue: bitcloutnanos,
      });
      transaction.save((err: any) => {
        if (err) {
          console.log(err);
          res.status(500).send("error saving transaction");
        } else {
          user.transactions.push(transaction._id);
          user.save((err: any) => {
            if (err) {
              console.log(err);
              res.status(500).send("error saving user");
            } else {
              axios
                .post(`${config.FULFILLMENT_API}/webhook/withdraw`, {
                  txn_id: transaction._id,
                })
                .then((response) => {
                  console.log(response);
                  res.sendStatus(200);
                })
                .catch((err) => {
                  res.status(500).send(err);
                });
            }
          });
        }
      });
    } else {
      res.status(400).send("insufficient balance");
    }
  } else {
    res.status(400).send("user not found");
  }
});

export default userRouter;
