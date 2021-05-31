import User from "../models/user";
import Order from "../models/order";
import Transaction from "../models/transaction";
import { getProfilePosts } from "../helpers/bitclout";
import { tokenAuthenticator, updateProfileSchema } from "../utils/middleware";
import { emailverified, servererror } from "../utils/mailBody";
import { emailVerify } from "../utils/mailBody";
import sendMail from "../utils/mailer";
import { generateCode } from "../utils/functions";

const createError = require("http-errors");
const userRouter = require("express").Router();

userRouter.get("/data", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({
    "bitclout.publicKey": req.key,
  }).exec();
  if (user) {
    res.json(user);
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.get("/profile/:username", async (req, res, next) => {
  const user = await User.findOne({
    "bitclout.username": req.params.username,
  }).exec();
  if (user) {
    res.json(user);
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.get("/resend-verification", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user) {
    const mailBody = emailVerify(user.verification.emailString);
    sendMail(user.email, mailBody.header, mailBody.body);
    res.sendStatus(201);
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.put("/update-email", tokenAuthenticator, async (req, res, next) => {
  const { email } = req.body;
  const emailCheck = await User.findOne({
    email: email,
  }).exec();
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user && !emailCheck) {
    user.email = email.toLowerCase();
    user.verification.email = false;
    const email_code = generateCode(8);
    user.verification.emailString = email_code;
    user.save((err: any) => {
      if (err) {
        next(err);
      } else {
        try {
          const mailBody = emailVerify(email_code);
          sendMail(email, mailBody.header, mailBody.body);
          res.sendStatus(201);
        } catch (err) {
          res.status(500).send({ error: err.message });
        }
      }
    });
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.put("/update-name", tokenAuthenticator, async (req, res, next) => {
  const { name } = req.body;
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user && name !== "") {
    user.name = name;
    user.save((err: any) => {
      if (err) {
        next(err);
      } else {
        res.sendStatus(201);
      }
    });
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.put("/update-profile", tokenAuthenticator, updateProfileSchema, async (req, res, next) => {
  const { email, name } = req.body;
  const emailCheck = await User.findOne({
    email: email,
  }).exec();
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  if (user && !emailCheck) {
    user.email = email.toLowerCase();
    user.name = name !== "" ? name : user.name;
    user.save((err: any) => {
      if (err) {
        next(err);
      } else {
        res.sendStatus(201);
      }
    });
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.get("/verify-email/:code", async (req, res, next) => {
  const code = req.params.code;
  const user = await User.findOne({ "verification.emailString": code }).exec();
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
    next(createError(400, "Invalid Link."));
  }
});

userRouter.get("/verify-bitclout/:depth", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key });
  const numToFetch = Number(req.params.depth) ? Number(req.params.depth) : 10;

  if (user) {
    try {
      const response = await getProfilePosts(numToFetch, user.bitclout.publicKey, user.bitclout.username);
      const posts = response.data.Posts;
      if (posts) {
        let i = 0;
        let found = false;
        for (const post of posts) {
          i += 1;
          const body = post.Body.toLowerCase();
          if (body.includes(user.verification.bitcloutString.toLowerCase())) {
            found = true;
          }
          if (i === posts.length) {
            if (found) {
              user.verification.status = "verified";
              await user.save();
              res.json({ data: post });
            } else {
              next(createError(400, "Unable to find verification post."));
            }
          }
        }
      } else {
        next(createError(409, "Bitclout API Error"));
      }
    } catch (e) {
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.get("/transactions", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key })
    .populate({ path: "transactions", options: { sort: { created: -1 } } })
    .exec();
  if (user) {
    res.json({ data: user.transactions });
  } else {
    next(createError(400, "Invalid Request."));
  }
});

userRouter.get("/transaction/:id", tokenAuthenticator, async (req, res, next) => {
  if (!req.params.id || req.params.id === "") {
    next(createError(400, "Invalid Request."));
  } else {
    const transaction = await Transaction.findById(req.params.id).exec();
    if (transaction) {
      res.json({ data: transaction });
    } else {
      next(createError(400, "Unable to find transaction."));
    }
  }
});

userRouter.get("/orders", tokenAuthenticator, async (req, res, next) => {
  const user = await User.findOne({ "bitclout.publicKey": req.key }).exec();
  if (user) {
    const orders = await Order.find({ username: user.bitclout.username }).sort({ created: "desc" }).exec();
    res.json({ data: orders });
  } else {
    next(createError(400, "Invalid Request."));
  }
});

export default userRouter;
