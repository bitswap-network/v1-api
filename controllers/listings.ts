const listingRouter = require("express").Router();
import Listing from "../models/listing";
import User from "../models/user";
const config = require("../utils/config");
const { tokenAuthenticator } = require("../utils/middleware");
import axios from "axios";

listingRouter.post("/create", tokenAuthenticator, async (req, res) => {
  const { saletype, bitcloutnanos, usdamount, etheramount } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    if (user.bitswapbalance >= bitcloutnanos) {
      if (saletype == "ETH") {
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "ETH",
          bitcloutnanos: bitcloutnanos,
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
                res.sendStatus(200);
              }
            });
          }
        });
      } else if (saletype == "USD") {
        console.log("usd");
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "USD",
          bitcloutnanos: bitcloutnanos,
          usdamount: usdamount,
        });
        listing.save((err: any) => {
          if (err) {
            console.log(err);
            res.status(500).send("error saving listing");
          } else {
            user.bitswapbalance -= bitcloutnanos;
            user.listings.push(listing._id);
            console.log("saved listing");
            user.save((err: any) => {
              if (err) {
                console.log(err);
                res.status(500).send("error saving user");
              } else {
                console.log("saved user");
                res.sendStatus(200);
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
    res.status(404).send("user not found");
  }
});

listingRouter.post("/buy", tokenAuthenticator, async (req, res) => {
  const { id } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: req.user.username });

  if (listing && user) {
    if (!user.buystate && !listing.completed.status && !listing.ongoing) {
      listing.buyer = user._id;
      listing.ongoing = true;
      user.buystate = true;
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
            listing.save((err: any) => {
              if (err) {
                res.status(500).send("error saving listing");
              } else {
                res.sendStatus(200);
              }
            });
          })
          .catch((error) => {
            console.log(error);
            res.status(500).send("error fetching usd/eth rates");
          });
      } else if (listing.currencysaletype == "ETH") {
        listing.save((err: any) => {
          if (err) {
            res.status(500).send("error saving listing");
          } else {
            res.sendStatus(200);
          }
        });
      }
    } else {
      res.status(400).send("user cannot have multiple ongoing buys");
    }
  } else {
    res.status(404).send("user or listing not found");
  }
});
listingRouter.post("/cancel", tokenAuthenticator, async (req, res) => {
  const { id } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: req.user.username });

  if (listing && user) {
    if (user.buystate || !listing.ongoing) {
      if (listing.escrow.balance > 0 || listing.escrow.full) {
        res
          .status(400)
          .send("cannot cancel as escrow funds have been deposited");
      } else {
        listing.ongoing = false;
        listing.buyer = null;
        user.buystate = false;
        user.buys.splice(user.listings.indexOf(listing._id), 1);
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
  const { id } = req.body;
  const listing = await Listing.findById(id).exec();
  const user = await User.findOne({ username: req.user.username });

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
        user.bitswapbalance += listing.bitcloutnanos;
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

listingRouter.post("/fulfillretry", tokenAuthenticator, async (req, res) => {
  const { id } = req.body;
  const listing = await Listing.findById(id).exec();

  if (listing) {
    const buyer = await User.findOne({ _id: listing.buyer }).exec();
    const seller = await User.findOne({ _id: listing.seller }).exec();
    if (buyer && seller) {
      if (
        req.user.username == buyer.username ||
        req.user.username == seller.username
      ) {
        axios
          .post(`${config.FULFILLMENT_API}/fulfillretry`, {
            listing_id: id,
          })
          .then((response) => {
            console.log(response);
            res.sendStatus(200);
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    }
    res.status(400).send("buyer or seller not found");
  } else {
    res.status(400).send("listing not found");
  }
});

listingRouter.get("/listings", async (req, res) => {
  let sortArr = ["asc", "desc", "descending", "ascending", -1, 1];
  // /listings?date=desc?volume=desc?
  const dateSort = req.query.date;
  const volumeSort = req.query.volume;

  console.log(dateSort, volumeSort);

  const listings = await Listing.find({})
    .sort({
      created: sortArr.includes(dateSort) ? dateSort : 1,
      bitcloutnanos: sortArr.includes(volumeSort) ? volumeSort : 1,
    })
    .populate("buyer")
    .populate("seller");
  if (listings) {
    res.json(listings);
  } else {
    res.status(400).send("listings not found");
  }
});

listingRouter.get("/listings/:id", tokenAuthenticator, async (req, res) => {
  const listings = await Listing.find({ seller: req.params.id });
  if (listings) {
    res.json(listings).populate("buyer").populate("seller");
  } else {
    res.status(400).send("listings not found");
  }
});

export default listingRouter;
