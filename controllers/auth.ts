import { generateAccessToken, generateCode } from "../utils/functions";
import User from "../models/user";
import sendMail from "../utils/mailer";
import { bruteforce, tokenAuthenticator } from "../utils/middleware";
import { getSingleProfile } from "../helpers/bitclout";
import { validateJwt } from "../helpers/identity";
import { emailVerify } from "../utils/mailBody";

const authRouter = require("express").Router();

authRouter.post("/register", async (req, res) => {
  const { PublicKeyBase58Check, email, name } = req.body;
  if (!PublicKeyBase58Check || !email || !name) {
    res.status(400).send({ message: "Missing fields in request body" });
  } else {
    const emailCheck = await User.findOne({
      email: name,
    }).exec();
    const publicKeyCheck = await User.findOne({
      "bitclout.publicKey": PublicKeyBase58Check,
    }).exec();
    if (emailCheck) {
      res.status(409).send({ message: "There is already a user using this email." });
    } else if (publicKeyCheck) {
      res.status(409).send({ message: "There is already a user using this public key." });
    } else {
      const newUser = new User({
        name: name,
        email: email,
        bitclout: { publicKey: PublicKeyBase58Check },
      });
      const email_code = generateCode(8);
      const bitclout_code = generateCode(16);
      newUser.verification.emailString = email_code;
      newUser.verification.bitcloutString = bitclout_code;
      newUser.save((err: any) => {
        if (err) {
          res.status(500).send(err);
        } else {
          try {
            const mailBody = emailVerify(email_code);
            sendMail(email, mailBody.header, mailBody.body);
            res.status(201).send("Registration successful");
          } catch (err) {
            res.status(500).send(err);
          }
        }
      });
    }
  }
});

authRouter.post("/login", bruteforce.prevent, async (req, res) => {
  const { PublicKeyBase58Check, identityJWT } = req.body;
  if (!PublicKeyBase58Check || !identityJWT) {
    res.status(400).send("invalid login params");
  } else {
    const user = await User.findOne({
      "bitclout.publicKey": PublicKeyBase58Check,
    }).exec();
    if (!user) {
      res.status(300).send({ error: "Public key does not exist within database." });
    } else if (user && validateJwt(PublicKeyBase58Check, identityJWT)) {
      const token = generateAccessToken({
        PublicKeyBase58Check: user.bitclout.publicKey,
      });
      let flowError;
      if (!user.verification.email) {
        res.status(403).send({ error: "Email not verified" });
      } else {
        try {
          const userProfile = await getSingleProfile(user.bitclout.publicKey);
          if (userProfile.status === 200 && userProfile.data.Profile) {
            user.bitclout.profilePicture = userProfile.data.Profile.ProfilePic;
            user.bitclout.bio = userProfile.data.Profile.Description;
            user.save();
          }
          if (userProfile.data.error) {
            console.log(userProfile.data.error);
          }
        } catch (error) {
          console.log(error);
          flowError = error;
        }
        res.json({
          user: user,
          token: token,
          error: flowError,
        });
      }
    } else {
      res.status(403).send({ error: "Invalid JWT" });
    }
  }
});

authRouter.get("/fetchProfile", async (req, res) => {
  if (!req.query.username && !req.query.publickey) {
    res.status(400).send("Username or public key must be part of request query params");
  } else {
    try {
      const Username = req.query.username ? req.query.username : "";
      const PublicKeyBase58Check = req.query.publickey ? req.query.publickey : "";
      const userProfile = await getSingleProfile(PublicKeyBase58Check, Username);
      if (userProfile.data.error) {
        res.status(400).send(userProfile.data.error);
      } else if (userProfile.data.Profile) {
        res.json(userProfile.data.Profile);
      } else {
        res.status(405).send(userProfile.data);
      }
    } catch (e) {
      res.status(500).send(e);
    }
  }
});

authRouter.get("/verifytoken", tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
