import { generateAccessToken, generateCode } from "../utils/functions";
import User from "../models/user";
import sendMail from "../utils/mailer";
import { bruteforce, tokenAuthenticator } from "../utils/middleware";
import whitelist from "../whitelist.json";
import { getSingleProfile } from "../utils/helper";
import { safeUserObject, emailVerify, checkEthAddr } from "../utils/functions";

const authRouter = require("express").Router();

authRouter.post("/register", async (req, res) => {
  let userlist = whitelist.users.map(function (x) {
    return x.toLowerCase();
  });
  const {
    username,
    email,
    password,
    bitcloutpubkey,
    ethereumaddress,
    bitcloutverified,
  } = req.body;
  if (!username || !email || !password || !bitcloutpubkey || !ethereumaddress) {
    res.status(400).send({ message: "Missing fields in request body" });
  } else if (password.length < 8) {
    res.status(400).send({ message: "Password formatting error" });
  } else {
    if (userlist.includes(username.toLowerCase())) {
      const user = await User.findOne({
        $or: [
          { username: username },
          { email: username },
          { bitcloutpubkey: bitcloutpubkey },
          { ethereumaddress: { $in: [ethereumaddress.toLowerCase()] } },
        ],
      }).exec();
      if (user) {
        res
          .status(409)
          .send({ message: "There is already a user with that information" });
      } else {
        let addrCheck = await checkEthAddr(ethereumaddress);
        if (addrCheck) {
          const newUser = new User({
            username: username,
            email: email,
            bitcloutpubkey: bitcloutpubkey,
            ethereumaddress: [ethereumaddress.toLowerCase()],
            bitcloutverified: bitcloutverified,
          });
          newUser.password = newUser.generateHash(password);
          const email_code = generateCode(8);
          const bitclout_code = generateCode(16);
          newUser.emailverification = email_code;
          newUser.bitcloutverification = bitclout_code;
          newUser.save((err: any) => {
            if (err) {
              res.status(500).send(err);
            } else {
              try {
                let mailBody = emailVerify(username, email_code, bitclout_code);
                sendMail(email, mailBody.header, mailBody.body);
                res.status(201).send("Registration successful");
              } catch (err) {
                res.status(500).send(err);
              }
            }
          });
        } else {
          res.status(400).send("invalid eth address");
        }
      }
    } else {
      res.status(401).send("User not in whitelist");
    }
  }
});

authRouter.post("/login", bruteforce.prevent, async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    $or: [
      { username: { $regex: new RegExp(`^${username}$`, "i") } },
      { email: { $regex: new RegExp(`^${username}$`, "i") } },
    ],
  }).exec();

  if (user && user.validPassword(password)) {
    const token = generateAccessToken({ username: user.username });
    let error;
    if (!user.emailverified) {
      res.status(403).send({ error: "Email not verified" });
    } else {
      try {
        const userProfile = await getSingleProfile(user.bitcloutpubkey);
        if (userProfile.status === 200 && userProfile.data.Profile) {
          user.profilepicture = userProfile.data.Profile.ProfilePic;
          user.description = userProfile.data.Profile.Description;
          user.save();
        }
        if (userProfile.data.error) {
          console.log(error);
        }
      } catch (error) {
        console.log(error);
        error = error;
      }
      res.json({
        ...safeUserObject(user),
        token: token,
        error: error,
      });
    }
  } else {
    res
      .status(404)
      .send({ error: "A user with those credentials does not exist" });
  }
});

authRouter.post("/getbitcloutprofile", async (req, res) => {
  const { PublicKeyBase58Check, Username } = req.body;
  let userlist = whitelist.users.map(function (x) {
    return x.toLowerCase();
  });
  if (userlist.includes(Username.toLowerCase())) {
    try {
      let userProfile = await getSingleProfile(PublicKeyBase58Check, Username);
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
  } else {
    console.log("user not in whitelist");
    res.status(401).send("User not in whitelist");
  }
});

authRouter.get("/verifytoken", tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
