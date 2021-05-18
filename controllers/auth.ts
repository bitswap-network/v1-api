import { generateAccessToken, generateCode } from "../utils/functions";
import User from "../models/user";
import sendMail from "../utils/mailer";
import * as middleware from "../utils/middleware";
import { getSingleProfile } from "../helpers/bitclout";
import { validateJwt } from "../helpers/identity";
import { emailVerify } from "../utils/mailBody";
const createError = require("http-errors");

const authRouter = require("express").Router();

authRouter.put("/register", async (req, res, next) => {
  const { publicKey, email, name } = req.body;

  const emailCheck = await User.findOne({
    email: name,
  }).exec();
  const publicKeyCheck = await User.findOne({
    "bitclout.publicKey": publicKey,
  }).exec();
  if (emailCheck) {
    next(createError(409, "There is already a user using this email."));
  } else if (publicKeyCheck) {
    next(createError(409, "There is already a user using this public key."));
  } else {
    const newUser = new User({
      name: name,
      email: email,
      bitclout: { publicKey: publicKey },
    });
    const email_code = generateCode(8);
    const bitclout_code = generateCode(16);
    newUser.verification.emailString = email_code;
    newUser.verification.bitcloutString = bitclout_code;
    newUser.save((err: any) => {
      if (err) {
        next(err);
      } else {
        try {
          const mailBody = emailVerify(email_code);
          sendMail(email, mailBody.header, mailBody.body);
          res.sendStatus(201);
        } catch (err) {
          next(err);
        }
      }
    });
  }
});

authRouter.post("/login", middleware.bruteforce.prevent, middleware.loginSchema, async (req, res, next) => {
  const { publicKey, identityJWT } = req.body;
  const user = await User.findOne({
    "bitclout.publicKey": publicKey,
  }).exec();
  if (!user) {
    next(createError(300, "Public key does not exist within database."));
  } else if (user && validateJwt(publicKey, identityJWT)) {
    const token = generateAccessToken({
      PublicKeyBase58Check: user.bitclout.publicKey,
    });

    try {
      const userProfile = await getSingleProfile(user.bitclout.publicKey);
      if (userProfile.data.Profile) {
        user.bitclout.profilePicture = userProfile.data.Profile.ProfilePic;
        user.bitclout.bio = userProfile.data.Profile.Description;
        user.bitclout.username = userProfile.data.Profile.Username;
        user.save();
        res.json({
          ...user,
          token: token,
        });
      } else {
        next(createError(405, "Bitclout API Error"));
      }
    } catch (e) {
      if (e.response.data.error) {
        next(createError(e.response.status, e.response.data.error));
      } else {
        next(e);
      }
    }
  } else {
    next(createError(401, `Invalid token.`));
  }
});

authRouter.post("/fetch-profile", middleware.fetchProfileSchema, async (req, res, next) => {
  const { publicKey, username } = req.body;
  try {
    const userProfile = await getSingleProfile(publicKey, username);
    if (userProfile.data.Profile) {
      res.json(userProfile.data.Profile);
    } else {
      next(createError(405, "Bitclout API Error"));
    }
  } catch (e) {
    if (e.response.data.error) {
      next(createError(e.response.status, e.response.data.error));
    } else {
      next(e);
    }
  }
});

authRouter.get("/verifytoken", middleware.tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
