const listingRouter = require("express").Router();
import Listing from "../models/listing";
import User from "../models/user";
const { tokenAuthenticator } = require("../utils/middleware");
import { Types } from "mongoose";
import axios from "axios";
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
            console.log(err);
            res.status(500).send("error saving listing");
          } else {
            user.bitswapbalance -= bitcloutnanos;
            user.listings.push(listing._id);
            user.save((err: any) => {
              if (err) {
                console.log(err);
                res.status(500).send("error saving user");
              } else {
                res.status(200);
              }
            });
          }
        });
      } else if (saletype == "USD") {
        console.log("usd");
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "USD",
          bitcloutamount: bitcloutnanos,
          usdamount: usdamount,
        });
        listing.save((err: any) => {
          if (err) {
            console.log(err);
            res.status(500).send("error saving listing");
          } else {
            user.bitswapbalance -= bitcloutnanos;
            user.listings.push(listing._id);
            user.save((err: any) => {
              if (err) {
                console.log(err);
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
    res.status(400).send("invalid");
  }
});

listingRouter.post("/buy", tokenAuthenticator, async (req, res) => {
  const { id, buyer } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: buyer });

  if (listing && user) {
    if (!user.buystate && !listing.completed.status) {
      listing.buyer = user._id;
      listing.ongoing = true;
      user.buys.push(listing._id);
      user.save((err: any) => {
        if (err) {
          res.status(500).send("error saving user");
        }
      });
      if (listing.currencysaletype == "USD") {
        axios
          .get(
            `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=SEJUHN1GDIV8A98RJWDI7IVDV1MP3SEZTW`
          )
          .then((response) => {
            let eth_usdrate = parseFloat(response.data.result.ethusd);
            listing.etheramount = listing.usdamount / eth_usdrate;
          })
          .catch((error) => {
            res.status(500).send("error fetching usd/eth rates");
          });
      }

      listing.save((err: any) => {
        if (err) {
          res.status(500).send("error saving listing");
        } else {
          res.sendStatus(200);
        }
      });
    } else {
      res.status(400).send("user cannot have multiple ongoing buys");
    }
  } else {
    res.status(400).send("user or listing not found");
  }
});
listingRouter.post("/cancel", tokenAuthenticator, async (req, res) => {
  const { id, buyer } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: buyer });

  if (listing && user) {
    if (user.buystate || !listing.ongoing) {
      if (listing.escrow.balance > 0 || listing.escrow.full) {
        res
          .status(400)
          .send("cannot cancel as escrow funds have been deposited");
      } else {
        listing.ongoing = false;
        // listing.buyer = null;
        user.buystate = false;
        listing.save((err: any) => {
          if (err) {
            res.status(500).send("could not save listing");
          } else {
            user.save((err: any) => {
              if (err) {
                res.status(500).send("could not save user");
              } else {
                res.sendStatus(200);
              }
            });
          }
        });
      }
    } else {
      res
        .status(400)
        .send(
          "user is not currently processing a transaction or listing is not active"
        );
    }
  } else {
    res.status(400).send("user or listing not found");
  }
});
listingRouter.post("/delete", tokenAuthenticator, async (req, res) => {
  const { id, seller } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: seller });

  if (listing && user) {
    if (
      user.buystate ||
      !listing.ongoing ||
      !listing.bitcloutsent ||
      !listing.completed.status
    ) {
      if (listing.escrow.balance > 0 || listing.escrow.full) {
        res.status(400).send("cannot delete a listing that is in progress");
      } else {
        user.listings.splice(user.listings.indexOf(listing._id), 1);
        user.buystate = false;
        user.bitswapbalance += listing.bitcloutamount;
        await Listing.deleteOne({ _id: listing._id });
        user.save((err: any) => {
          if (err) {
            res.status(500).send("could not save user");
          } else {
            res.sendStatus(200);
          }
        });
      }
    } else {
      res
        .status(400)
        .send(
          "user is not currently processing a transaction or listing is not active"
        );
    }
  } else {
    res.status(400).send("user or listing not found");
  }
});

export default listingRouter;
