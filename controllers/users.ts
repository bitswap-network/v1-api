const userRouter = require("express").Router();
import User from "../models/user";
const { tokenAuthenticator } = require("../utils/middleware");
import sendMail from "../utils/mailer";
import Transaction from "../models/transaction";
import { generateCode } from "../utils/functions";
import proxy from "../utils/proxy";
import { Types } from "mongoose";
const bcrypt = require("bcrypt");

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
  const { username, name, email, ethereumaddress, bitcloutpubkey } = req.body;
  await User.updateOne(
    {
      username: username,
    },
    {
      email: email,
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
  const { username, oldpassword, newpassword } = req.body;
  const user = await User.findOne({ username: username }).exec();
  if (user && user.validPassword(oldpassword)) {
    user.password = bcrypt.hashSync(newpassword, 8);
    user.save((err: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send("Password successfully updated");
      }
    });
  } else {
    res.status(400).send("Incorrect password");
  }
});

userRouter.post("/forgotpassword", tokenAuthenticator, async (req, res) => {
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
          `Click <a href="https://api.bitswap.network/user/verifypassword/${code}">here</a> to reset your password. If you didn't request a password change, simply ignore this email.`
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
        res.status(200).sendFile(__dirname, "../pages/emailverified.html");
      })
      .catch((error) => {
        res.status(500).sendFile(__dirname, "../pages/servererror.html");
      });
  } else {
    res.status(404).sendFile(__dirname, "../pages/invalidlink.html");
  }
  //responses dont work, verification checks through
});

userRouter.get("/verifypassword/:code", async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ passwordverification: code }).exec();
  if (user) {
    const password = generateCode();
    user.password = password;
    user.passwordverification = "";
    user
      .save()
      .then(() => {
        res
          .status(200)
          .send(
            `<html><body><p>Your temporary password is "${password}" (no quotation marks).</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>`
          );
      })
      .catch((error) => {
        res.status(500).sendFile(__dirname, "../pages/servererror.html");
      });
  } else {
    res.status(404).sendFile(__dirname, "../pages/invalidlink.html");
  }
});

userRouter.post("/deposit", tokenAuthenticator, async (req, res) => {
  const { username, bitcloutpubkey, bitcloutvalue } = req.body;
  const user = await User.findOne({ username: username }).exec();
  if (user) {
    const transaction = new Transaction({
      username: username,
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
      await proxy.initiateSendBitclout(20, bitcloutpubkey, bitcloutnanos);
      await proxy.sendBitclout().then((response) => {
        if (JSON.parse(response).TransactionIDBase58Check) {
          const res_json = JSON.parse(response);
          const transaction = new Transaction({
            username: username,
            bitcloutpubkey: bitcloutpubkey,
            transactiontype: "withdraw",
            status: "completed",
            bitcloutvalue: res_json.SpendAmountNanos,
            tx_id: res_json.TransactionIDBase58Check,
          });
          user.bitswapbalance -= res_json.SpendAmountNanos;
          transaction.save((err: any) => {
            if (err) {
              res.status(500).send("error saving transaction");
            } else {
              user.transactions.push(transaction._id);
              user.save((err: any) => {
                if (err) {
                  res.status(500).send("error saving user");
                } else {
                  res.status(200);
                }
              });
            }
          });
        } else {
          res.status(500).send("error sending txn");
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
