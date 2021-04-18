const jwt = require("jsonwebtoken");
const config = require("./config");

export const generateCode = () =>
  [...Array(8)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

export const generateAccessToken = (username: any) => {
  return jwt.sign(username, config.SECRET, { expiresIn: "18000s" });
};
