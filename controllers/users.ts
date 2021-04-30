const userRouter = require("express").Router();
import User from "../models/user";
const { tokenAuthenticator } = require("../utils/middleware");
import sendMail, {
  emailverified,
  invalidlink,
  servererror,
} from "../utils/mailer";
import Transaction from "../models/transaction";
import { generateCode, generateHMAC } from "../utils/functions";
const config = require("../utils/config");
import axios from "axios";
import Proxy from "../utils/proxy";

userRouter.get("/data", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({
    username: req.user.username,
  })
    .populate({
      path: "listings",
      populate: { path: "buyer seller" },
    })
    .populate({
      path: "buys",
      populate: { path: "buyer seller" },
    })
    .populate("transactions")
    .exec();
  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
});

userRouter.get("/profile/:username", async (req, res) => {
  const user = await User.findOne({
    username: req.params.username,
  }).exec();
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).send("User not found");
  }
});

userRouter.put("/updateprofile", tokenAuthenticator, async (req, res) => {
  const { name, email, ethereumaddress } = req.body;
  await User.updateOne(
    {
      username: req.user.username,
    },
    {
      email: email.toLowerCase(),
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
    const code = generateCode(8);
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
    const password = generateCode(8);
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
  const { bitcloutvalue } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user && user.verified === "verified") {
    const txns = await Transaction.find({
      bitcloutpubkey: user.bitcloutpubkey,
      transactiontype: "deposit",
      status: "pending",
    }).exec();
    if (txns.length == 0) {
      const transaction = new Transaction({
        username: req.user.username,
        bitcloutpubkey: user.bitcloutpubkey,
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
              res.status(201).send(transaction);
            }
          });
        }
      });
    } else {
      res
        .status(409)
        .send(
          "cannot have multiple ongoing deposits. please wait for previous deposit to complete."
        );
    }
  } else {
    res.status(400).send("user not found");
  }
});

userRouter.post("/withdraw", tokenAuthenticator, async (req, res) => {
  const { bitcloutvalue, fees } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user && user.verified === "verified") {
    if (bitcloutvalue <= user.bitswapbalance) {
      const transaction = new Transaction({
        username: req.user.username,
        bitcloutpubkey: user.bitcloutpubkey,
        transactiontype: "withdraw",
        status: "pending",
        bitcloutnanos: bitcloutvalue * 1e9,
        fees: fees,
      });
      console.log(parseInt((bitcloutvalue - fees).toString()));
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
              let body = {
                username: req.user.username,
                txn_id: transaction._id,
              };
              axios
                .post(`${config.FULFILLMENT_API}/core/withdraw`, body, {
                  headers: { "server-signature": generateHMAC(body) },
                })
                .then((response) => {
                  // console.log(response);
                  res.status(response.status).send(response.statusText);
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
userRouter.post("/preFlightTxn", tokenAuthenticator, async (req, res) => {
  const { bitcloutvalue } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user && user.verified === "verified") {
    if (bitcloutvalue) {
      await axios
        .post(
          "https://api.bitclout.com/send-bitclout",
          JSON.stringify({
            AmountNanos: bitcloutvalue * 1e9,
            MinFeeRateNanosPerKB: 1000,
            RecipientPublicKeyOrUsername: user.bitcloutpubkey,
            SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              Cookie:
                "__cfduid=d0e96960ab7b9233d869e566cddde2b311619467183; INGRESSCOOKIE=e663da5b29ea8969365c1794da20771c",
            },
          }
        )
        .then((response) => {
          console.log(response.data);
          res.send(response.data);
        })
        .catch((error) => {
          console.log(error);
          res.status(error.response.status).send(error.response.data);
        });
    } else {
      res.status(400).send("invalid request");
    }
  } else {
    res.status(400).send("User not found");
  }
});

userRouter.post("/verifyBitclout", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    let proxy = new Proxy();
    await proxy.initiatePostsQuery(
      20,
      "BC1YLjQtaLyForGFpdzmvzCCx1zbSCm58785cABn5zS8KVMeS4Z4aNK",
      user.bitcloutpubkey,
      user.username,
      5
    );
    proxy
      .getPosts()
      .then((response) => {
        proxy.close();
        let resJSON = JSON.parse(response);
        let error = resJSON["error"];
        let posts = resJSON["Posts"];
        if (error) {
          res.status(500).send(error);
        } else if (posts) {
          console.log(posts);
          let i = 0;
          let found = false;
          let key = user.bitcloutverification;
          for (const post of posts) {
            i += 1;
            let body = post.Body.toLowerCase();
            if (body.includes(key.toLowerCase())) {
              found = true;
            }
            if (i === posts.length) {
              if (found) {
                console.log("found");
                user.verified = "verified";
                user.save();
                res.status(200).send(post);
              } else {
                user.verified = "pending";
                user.save();
                res
                  .status(400)
                  .send("unable to find profile verification post");
              }
            }
          }
          res.status(200).send(posts);
        }
        console.log(error);
      })
      .catch((error) => {
        proxy.close();
        console.log(error);
        res.send(500);
      });
  } else {
    res.status(400).send("user not found");
  }
});

userRouter.get("/transactions", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username })
    .populate("transactions")
    .exec();
  if (user) {
    res.json(user.transactions);
  } else {
    res.status(500).send("unable to fetch transactions");
  }
});

export default userRouter;
