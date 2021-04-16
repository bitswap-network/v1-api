const listingRouter = require("express").Router();
import Listing from "../models/Listing";
import User from "../models/user";
const { tokenAuthenticator } = require("../utils/middleware");
import { Types } from "mongoose";

listingRouter.post("/create", tokenAuthenticator, async (req, res) => {
  const { seller, saletype, bitcloutnanos, usdamount, etheramount } = req.body;
  const user = await User.findOne({ username: seller }).exec();
  if (user) {
    if (user.bitswapbalance >= bitcloutnanos) {
      if (saletype == "ETH") {
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "ETH",
          bitcloutamount: bitcloutnanos,
          etheramount: etheramount,
        });

        listing.save((err: any) => {
          if (err) {
            res.status(500).send("error saving listing");
          } else {
            user.listings.push(listing._id);
            user.save((err: any) => {
              if (err) {
                res.status(500).send("error saving user");
              } else {
                res.status(200);
              }
            });
          }
        });
      } else if (saletype == "USD") {
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "USD",
          bitcloutamount: bitcloutnanos,
          usdamount: usdamount,
        });
        listing.save((err: any) => {
          if (err) {
            res.status(500).send("error saving listing");
          } else {
            user.listings.push(listing._id);
            user.save((err: any) => {
              if (err) {
                res.status(500).send("error saving user");
              } else {
                res.status(200);
              }
            });
          }
        });
      } else {
        res.status(400).send("invalid sale type");
      }
    } else {
      res.status(402).send("insufficient funds to post this listing");
    }
  } else {
    res.status(400).send("user not found");
  }
});

listingRouter.get("/buy", tokenAuthenticator, async (req, res) => {
  const { id, buyer } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: buyer });
  if (listing && user) {
    listing.buyer = user._id;
    listing.ongoing = true;
    user.buys.push(listing._id);
    user.save((err: any) => {
      if (err) {
        res.status(500).send("error saving user");
      }
    });
    listing.save((err: any) => {
      if (err) {
        res.status(500).send("error saving listing");
      } else {
        res.sendStatus(200);
      }
    });
  } else {
    res.status(400).send("user or listing not found");
  }
});

export default listingRouter;
