import { generateAccessToken, generateCode } from "../utils/functions";
import User from "../models/user";
import Listing from "../models/listing";
const logger = require("../utils/config");
const Web3 = require("web3");
const mongoose = require("mongoose");
const webhookRouter = require("express").Router();
const config = require("../utils/config");
const web3 = new Web3(new Web3.providers.HttpProvider(config.HttpProvider));

webhookRouter.post("/escrow", async (req, res) => {
  const { fromAddress, toAddress, value, asset, hash } = req.body.activity[0];
  console.log(req.body.activity[0], fromAddress);
  const buyer = await User.findOne({
    ethereumaddress: fromAddress.toLowerCase(),
  });
  web3.eth.getTransaction(hash).then(async (response) => {
    if (response) {
      if (buyer) {
        const listing = await Listing.findOne({
          buyer: buyer._id,
        }).exec();
        if (listing) {
          if (value >= listing.etheramount) {
            listing.escrow.balance += value;
            listing.escrow.full = true;
          } else {
            res.status(400).send("insufficient funds");
          }
        } else {
          res.status(400).send("no associated listing");
        }
      } else {
        res.status(400).send("buyer not found");
      }
    } else {
      res.status(400).send("txn hash not valid");
    }
  });
});

export default webhookRouter;
