const userRouter = require("express").Router();
const User = require("../models/user");
const { tokenAuthenticator } = require("../utils/middleware");
const logger = require("../utils/logger");
const config = require("../utils/config");
const sendMail = require("../utils/send");
import proxy from "../utils/proxy";

userRouter.get("/profile/:username", tokenAuthenticator, async (req, res) => {
  const profile = await User.findOne({
    username: req.params.username,
  }).exec();
  if (profile) {
    // Get bio and profile picture from Bitclout API
    res.json(profile);
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
      ethereumaddress: ethereumaddress,
      name: name,
    },
    (err: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.sendStatus(201);
      }
    }
  );
});

userRouter.post("/updatepassword", tokenAuthenticator, async (req, res) => {
  const { username, oldpassword, newpassword } = req.body;
  const user = await User.findOne({ username: username }).exec();
  if (user.validPassword(oldpassword)) {
    user.password = user.generateHash(newpassword);
    user.save((err: any) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.sendStatus(201);
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
    try {
      sendMail(
        email,
        "Reset your BitSwap password",
        `Click <a>here</a> to reset your password. If you didn't request a password change, simply ignore this email.`
      );
      res.status(200).send("Email successfully sent");
    } catch (error) {
      res.status(500).send("The email could not be sent");
    }
  } else {
    res.status(404).send("A user with that email could not be found");
  }
});
export default userRouter;
