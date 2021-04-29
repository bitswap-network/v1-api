import { generateAccessToken, generateCode } from "../utils/functions";

const authRouter = require("express").Router();
import User from "../models/user";
import sendMail from "../utils/mailer";
import { bruteforce, tokenAuthenticator } from "../utils/middleware";
import Proxy from "../utils/proxy";
import axios from "axios";
import whitelist from "../whitelist.json";
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
          { ethereumaddress: ethereumaddress },
        ],
      }).exec();
      if (user) {
        res
          .status(409)
          .send({ message: "There is already a user with that information" });
      } else {
        const newUser = new User({
          username: username,
          email: email,
          bitcloutpubkey: bitcloutpubkey,
          ethereumaddress: ethereumaddress.toLowerCase(),
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
              sendMail(
                email,
                "Verify your BitSwap email",
                `<!DOCTYPE html><html><head><title>BitSwap Email Verification</title><body>` +
                  `<p>Click <a href="https://bitswap-api.herokuapp.com/user/verifyemail/${email_code}">here</a> to verify your email. If this wasn't you, simply ignore this email.` +
                  `<p>Make a post on your $${username} BitClout profile saying: "Verifying my @BitSwap account. ${bitclout_code}" (make sure you tag us) to verify that you own this BitClout account.</p>` +
                  `</body></html>`
              );
              res.status(201).send("Registration successful");
            } catch (err) {
              res.status(500).send(err);
            }
          }
        });
      }
    } else {
      res.status(401).send("User not in whitelist");
    }
  }
});

authRouter.post("/login", bruteforce.prevent, async (req, res) => {
  const { username, password } = req.body;
  const token = generateAccessToken({ username: username });

  const user = await User.findOne({
    $or: [{ username: username }, { email: username }],
  }).exec();

  if (user && user.validPassword(password)) {
    if (!user.emailverified) {
      res.status(403).send({ error: "Email not verified" });
    } else {
      try {
        const response = await axios.post(
          "https://api.bitclout.com/get-single-profile",
          { PublicKeyBase58Check: user.bitcloutpubkey },
          {
            headers: {
              "Content-Type": "application/json",
              Cookie:
                "__cfduid=d948f4d42aa8cf1c00b7f93ba8951d45b1619496624; INGRESSCOOKIE=c7d7d1526f37eb58ae5a7a5f87b91d24",
            },
          }
        );
        if (response.status === 200) {
          user.profilepicture = response.data.Profile.ProfilePic;
          user.description = response.data.Profile.Description;
          await user.save();
        }
      } catch (error) {
        console.log(error);
        // res.status(500).send(error);
      }
      res.json({
        admin: user.admin,
        bitcloutpubkey: user.bitcloutpubkey,
        bitswapbalance: user.bitswapbalance,
        buys: user.buys,
        buystate: user.buystate,
        created: user.created,
        email: user.email,
        emailverified: user.emailverified,
        ethereumaddress: user.ethereumaddress,
        listings: user.listings,
        ratings: user.ratings,
        transactions: user.transactions,
        username: user.username,
        verified: user.verified,
        token: token,
        _id: user._id,
        bitcloutverified: user.bitcloutverified,
        profilepicture: user.profilepicture,
        description: user.description,
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
    axios
      .post(
        "https://api.bitclout.com/get-single-profile",
        { PublicKeyBase58Check: PublicKeyBase58Check, Username: Username },
        {
          headers: {
            "Content-Type": "application/json",
            Cookie:
              "__cfduid=d948f4d42aa8cf1c00b7f93ba8951d45b1619496624; INGRESSCOOKIE=c7d7d1526f37eb58ae5a7a5f87b91d24",
          },
        }
      )
      .then((response) => {
        let resJSON = response.data;
        if (resJSON.error) {
          res.status(400).send(resJSON.error);
        } else if (resJSON.Profile) {
          res.json(resJSON.Profile);
        } else {
          res.sendStatus(405);
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send(error);
      });
  } else {
    console.log("user not in whitelist");
    res.status(401).send("User not in whitelist");
  }
});

authRouter.get("/verifytoken", tokenAuthenticator, (req, res) => {
  res.sendStatus(204);
});

export default authRouter;
