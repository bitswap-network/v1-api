import User from "../models/user";
import { getProfilePosts, preFlightSendBitclout } from "../utils/helper";
import { tokenAuthenticator } from "../utils/middleware";
import sendMail from "../utils/mailer";
import {
  emailverified,
  invalidlink,
  servererror,
  passwordResetEmail,
  verifyPasswordHTML,
} from "../utils/mailBody";
import { generateCode } from "../utils/functions";
import * as config from "../utils/config";

const userRouter = require("express").Router();

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

userRouter.put("/updateProfile", tokenAuthenticator, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ username: req.user.username });
  if (user) {
    user.email = email.toLowerCase();
    user.save((err: any, doc: any) => {
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
    user.verification.passwordString = code;
    user
      .save()
      .then(() => {
        let mailBody = passwordResetEmail(code);
        sendMail(email, mailBody.header, mailBody.body);
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
    user.verification.email = true;
    user.verification.emailString = "";
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
    user.verification.passwordString = "";
    user
      .save()
      .then(() => {
        res.status(200).send(verifyPasswordHTML(password));
      })
      .catch((error) => {
        res.status(500).send(servererror);
      });
  } else {
    res.status(404).send(invalidlink);
  }
});

userRouter.post("/preFlightTxn", tokenAuthenticator, async (req, res) => {
  const { bitcloutvalue } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user && user.verification.status === "verified") {
    if (bitcloutvalue) {
      try {
        let preflight = await preFlightSendBitclout({
          AmountNanos: bitcloutvalue * 1e9,
          MinFeeRateNanosPerKB: 1000,
          RecipientPublicKeyOrUsername: user.bitclout.publicKey,
          SenderPublicKeyBase58Check: config.PUBLIC_KEY_BITCLOUT,
        });
        if (preflight.data.error) {
          res.status(500).send(preflight.data);
        } else {
          res.send(preflight.data);
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

userRouter.post("/verifyBitclout", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec();
  const numToFetch = 20;
  if (user) {
    try {
      const response = await getProfilePosts(
        20,
        user.bitclout.publicKey,
        user.username
      );
      let error = response.data.error;
      let posts = response.data.Posts;
      if (error) {
        res.status(500).send(error);
      } else if (posts) {
        console.log(posts);
        let i = 0;
        let found = false;
        let key = user.verification.bitcloutString;
        for (const post of posts) {
          i += 1;
          let body = post.Body.toLowerCase();
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
