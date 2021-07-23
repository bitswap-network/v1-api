import { generateAccessToken, generateCode } from "../utils/functions";
import User from "../models/user";
import sendMail from "../utils/mailer";
import * as middleware from "../utils/middleware";
import { getKeyPair, getSingleProfile } from "../helpers/bitclout";
import { createPersonaAccount, getPersonaAccount } from "../helpers/persona";
import { encryptGCM, validateJwt } from "../helpers/crypto";
import { emailVerify } from "../utils/mailBody";
import { formatUserBalances } from "../helpers/wallet";
import Wallet from "../models/wallet";
import * as config from "../config";
const createError = require("http-errors");

const authRouter = require("express").Router();

authRouter.put("/register", middleware.registerSchema, async (req, res, next) => {
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
    newUser.verification.emailString = email_code;

    newUser.save(async (err: any) => {
      if (err) {
        next(err);
      } else {
        try {
          const encryptedUserPublicKey = encryptGCM(newUser._id.toString(), config.WALLET_HASHKEY);
          const keyPair = (await getKeyPair({ Mnemonic: config.MNEMONIC, ExtraText: encryptedUserPublicKey, Index: 0 })).data;
          const userWallet = new Wallet({
            keyInfo: {
              bitclout: {
                publicKeyBase58Check: keyPair.PublicKeyBase58Check,
                publicKeyHex: keyPair.PublicKeyHex,
                privateKeyBase58Check: encryptGCM(keyPair.PrivateKeyBase58Check, config.WALLET_HASHKEY),
                privateKeyHex: encryptGCM(keyPair.PrivateKeyHex, config.WALLET_HASHKEY),
                extraText: encryptedUserPublicKey,
                index: 0,
              },
            },
            user: newUser._id,
            balance: {
              bitclout: 0,
            },
          });
          await userWallet.save();
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

authRouter.post("/login", middleware.loginSchema, async (req, res, next) => {
  const { publicKey, identityJWT } = req.body;
  const adminOnly = true;
  // if (process.env.ENVIRONMENT !== "production") {
  //   adminOnly = true;
  // }
  // let user;
  // if (adminOnly) {
  const user = await User.findOne({
    "bitclout.publicKey": publicKey,
    admin: adminOnly,
  }).exec();
  // } else {
  //   user = await User.findOne({
  //     "bitclout.publicKey": publicKey,
  //     admin: true,
  //   }).exec();
  // }

  if (!user) {
    next(createError(406, "Public key does not exist within database."));
  } else if (user && adminOnly && !user.admin) {
    next(createError(401, "User must be admin."));
  } else if (user && validateJwt(publicKey, identityJWT)) {
    const token = generateAccessToken({
      PublicKeyBase58Check: user.bitclout.publicKey,
    });
    const wallet = await Wallet.findOne({ user: user._id }).exec();
    try {
      const profileResp = await getSingleProfile(user.bitclout.publicKey);
      user.bitclout.bio = profileResp.data.Profile.Description;
      user.bitclout.username = profileResp.data.Profile.Username;

      if (!user.verification.personaAccountId) {
        const personaAccountResp = await getPersonaAccount(user.bitclout.publicKey);
        console.log(personaAccountResp.data);
        if (personaAccountResp.data.data.length > 0) {
          user.verification.personaAccountId = personaAccountResp.data.data[0].id;
        } else {
          const personaCreationResp = await createPersonaAccount(user.bitclout.publicKey);
          console.log(personaCreationResp);
          user.verification.personaAccountId = personaCreationResp.data.data.id;
        }
      }
      if (!user.tier) {
        user.tier = 0;
      }
      user.balance.in_transaction = false;
      await user.save();
      res.json({
        user: formatUserBalances(user),
        token: token,
        wallet: {
          bitclout: {
            publicKey: wallet?.keyInfo.bitclout.publicKeyBase58Check,
          },
        },
      });
    } catch (e) {
      user.save();
      console.error(e);
      res.json({
        user: formatUserBalances(user),
        token: token,
        wallet: {
          bitclout: {
            publicKey: wallet?.keyInfo.bitclout.publicKeyBase58Check,
          },
        },
      });
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
      next(createError(409, "Bitclout API Error"));
    }
  } catch (e) {
    if (e.response?.data.error) {
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
