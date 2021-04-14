const authRouter = require("express").Router();
const User = require("../models/user");
const { tokenAuthenticator } = require("../utils/middleware");
const logger = require("./utils/logger");
const config = require("./utils/config");

authRouter.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).send("Missing fields in request body");
  } else {
    const newUser = new User({
      username: username,
      email: email,
    });
    newUser.password = newUser.generateHash(password);
    newUser.save((err) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.sendStatus(201);
      }
    });
  }
});

authRouter.post("/login", (req, res) => {});

export default authRouter;
