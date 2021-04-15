const userRouter = require("express").Router();
const User = require("../models/user");
const { tokenAuthenticator } = require("../utils/middleware");
const sendMail = require("../utils/send");
import { generateCode } from "../utils/functions";
import proxy from "../utils/proxy";

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
      ethereumaddress: ethereumaddress,
      name: name,
    },
    (err: any) => {
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
  if (user.validPassword(oldpassword)) {
    user.password = user.generateHash(newpassword);
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
    user.save().then(() => {
      sendMail(
        email,
        "Reset your BitSwap password",
        `Click <a href="https://api.bitswap.network/user/verifypassword/${code}">here</a> to reset your password. If you didn't request a password change, simply ignore this email.`
      );
    }).then(() => {
      res.status(200).send("Email successfully sent");
    }).catch(error => {
      res.status(500).send("An error occurred:", error);
    })
  } else {
    res.status(404).send("A user with that email could not be found");
  }
});

userRouter.post("/verifyemail/:code", tokenAuthenticator, async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ emailverification: code }).exec();
  if (user) {
    user.emailverified = true;
    user.emailverification = null;
    user.save().then(() => {
      res.status(200).sendFile(__dirname, '../pages/emailverified.html');
    }).catch(error => {
      res.status(500).sendFile(__dirname, '../pages/servererror.html');
    });
  } else {
    res.status(404).sendFile(__dirname, '../pages/invalidlink.html');
  }
});

userRouter.post("/verifypassword/:code", tokenAuthenticator, async (req, res) => {
  const code = req.params.code;
  const user = await User.findOne({ passwordverification: code }).exec();
  if (user) {
    const password = generateCode();
    user.password = password;
    user.passwordverification = null;
    user.save().then(() => {
      res.status(200).send(`<html><body><p>Your temporary password is "${password}" (no quotation marks).</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>`);
    }).catch(error => {
      res.status(500).sendFile(__dirname, '../pages/servererror.html');
    });
  } else {
    res.status(404).sendFile(__dirname, '../pages/invalidlink.html');
  }
})

export default userRouter;