import User from "../models/user";
import { getProfilePosts, submitTransaction } from "../helpers/bitclout";
import { tokenAuthenticator } from "../utils/middleware";
import { emailverified, invalidlink, servererror } from "../utils/mailBody";

const userRouter = require("express").Router();

userRouter.get("/data", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({
    "bitclout.publicKey": req.key,
  }).exec();
  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
});

userRouter.get("/profile/:username", async (req, res) => {
  const user = await User.findOne({
    "bitclout.username": req.params.username,
  }).exec();
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).send("User not found");
  }
});

userRouter.put("/update-profile", tokenAuthenticator, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ username: req.user.username });
  if (user) {
    user.email = email.toLowerCase();
    user.save((err: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send("Profile successfully updated");
      }
    });
  } else {
    res.sendStatus(400);
  }
});

userRouter.get("/verify-email/:code", async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ emailverification: code }).exec();
  if (user) {
    user.verification.email = true;
    user.verification.emailString = "";
    user
      .save()
      .then(() => {
        res.status(200).send(emailverified);
      })
      .catch(error => {
        res.status(500).send(servererror);
      });
  } else {
    res.status(404).send(invalidlink);
  }
});

userRouter.post("/submit-deposit", tokenAuthenticator, async (req, res) => {
  const { TransactionHex } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user && user.verification.status === "verified") {
    if (TransactionHex) {
      try {
        const txnResp = await submitTransaction({
          TransactionHex: TransactionHex,
        });
        if (txnResp.data.error) {
          res.status(500).send(txnResp.data);
        } else {
          res.send(txnResp.data);
        }
      } catch (error) {
        console.log(error);
        res.status(error.response.status).send(error.response.data);
      }
    } else {
      res.status(400).send("invalid request");
    }
  } else {
    res.status(400).send("User not found");
  }
});

userRouter.get("/verify-bitclout/:depth", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec();
  const numToFetch = req.params.depth ? req.params.depth : 20;
  if (user) {
    try {
      const response = await getProfilePosts(numToFetch, user.bitclout.publicKey, user.bitclout.username);
      const error = response.data.error;
      const posts = response.data.Posts;
      if (error) {
        res.status(500).send(error);
      } else if (posts) {
        console.log(posts);
        let i = 0;
        let found = false;
        const key = user.verification.bitcloutString;
        for (const post of posts) {
          i += 1;
          const body = post.Body.toLowerCase();
          if (body.includes(key.toLowerCase())) {
            found = true;
          }
          if (i === posts.length) {
            if (found) {
              user.verification.status = "verified";
              user.save();
              res.status(200).send(post);
            } else {
              user.verification.status = "pending";
              user.save();
              res.status(400).send("unable to find profile verification post");
            }
          }
        }
      }
    } catch (e) {
      res.status(500).send(e);
    }
  } else {
    res.status(400).send("user not found");
  }
});

userRouter.get("/transactions", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).populate("transactions").exec();
  if (user) {
    res.json(user.transactions);
  } else {
    res.status(500).send("user not found");
  }
});

export default userRouter;
