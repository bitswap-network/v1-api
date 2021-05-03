const listingRouter = require("express").Router();
import Listing from "../models/listing";
import User from "../models/user";
import { generateHMAC } from "../utils/functions";
import sendMail from "../utils/mailer";
const config = require("../utils/config");
const { tokenAuthenticator } = require("../utils/middleware");
import axios from "axios";

listingRouter.post("/create", tokenAuthenticator, async (req, res) => {
  const {
    saletype,
    bitcloutnanos,
    usdamount,
    etheramount,
    ethaddress,
  } = req.body;
  const user = await User.findOne({ username: req.user.username }).exec();
  if (
    user &&
    user.verified === "verified" &&
    etheramount &&
    bitcloutnanos &&
    usdamount &&
    ethaddress
  ) {
    if (user.bitswapbalance >= bitcloutnanos / 1e9) {
      if (saletype == "USD") {
        console.log("usd");
        const listing = new Listing({
          seller: user._id,
          currencysaletype: "USD",
          bitcloutnanos: bitcloutnanos,
          usdamount: usdamount,
          etheramount: etheramount,
          ethaddress: ethaddress,
        });
        listing.save((err: any) => {
          if (err) {
            console.log(err);
            res.status(500).send("error saving listing");
          } else {
            user.bitswapbalance -= bitcloutnanos / 1e9;
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
    res
      .status(400)
      .send("invalid request: user not verified or fields missing");
  }
});

listingRouter.post("/buy", tokenAuthenticator, async (req, res) => {
  const { id } = req.body;
  const listing = await Listing.findById(id).exec();
  const buyer = await User.findOne({ username: req.user.username });

  if (listing && buyer && buyer.verified === "verified") {
    const seller = await User.findById(listing.seller).exec();
    if (
      seller &&
      !buyer.buystate &&
      !listing.completed.status &&
      !listing.ongoing
    ) {
      listing.buyer = buyer._id;
      listing.ongoing = true;
      buyer.buystate = true;
      buyer.buys.push(listing._id);
      buyer.save((err: any) => {
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
                try {
                  sendMail(
                    seller.email,
                    `Transaction Notification Alert`,
                    `<!DOCTYPE html><html><head><title>Transaction Notification Alert</title><body>` +
                      `<p>@${buyer.username} has started a transaction with your listing.` +
                      `<p>Click <a href="https://app.bitswap.network/listing/${listing._id}">here</a> to view.</p>` +
                      `</body></html>`
                  );
                  res.sendStatus(200);
                } catch (err) {
                  res.status(500).send(err);
                }
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
  const buyer = await User.findOne({ username: req.user.username });

  if (listing && buyer) {
    if (listing.ongoing) {
      if (listing.escrow.balance > 0 || listing.escrow.full) {
        res
          .status(400)
          .send("cannot cancel as escrow funds have been deposited");
      } else {
        listing.ongoing = false;
        listing.buyer = null;
        buyer.buystate = false;
        await User.findOneAndUpdate(
          { username: req.user.username },
          { $pull: { buys: listing._id } }
        ).exec();
        listing.save((err: any) => {
          if (err) {
            res.status(500).send("could not save listing");
          } else {
            buyer.save((err: any) => {
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
      res.status(400).send("listing is not active");
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
        await User.findOneAndUpdate(
          { username: req.user.username },
          { $pull: { listings: listing._id } }
        ).exec();
        user.buystate = false;
        user.bitswapbalance += listing.bitcloutnanos / 1e9;
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

listingRouter.get("/listings", async (req, res) => {
  let sortArr = ["asc", "desc", "descending", "ascending", -1, 1];
  // /listings?date=desc?volume=desc?
  const dateSort = req.query.dateSort;
  const volumeSort = req.query.volume;
  const priceSort = req.query.priceSort;

  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const minVolume = req.query.minVolume;
  const maxVolume = req.query.maxVolume;
  const resultsCount = req.query.count;

  // console.log(dateSort, volumeSort);

  let listings = await Listing.find({
    ongoing: false,
    "completed.status": false,
  })
    .sort({
      created: sortArr.includes(dateSort) ? dateSort : -1,
      bitcloutnanos: sortArr.includes(volumeSort) ? volumeSort : 1,
    })
    .limit(resultsCount)
    .populate("buyer")
    .populate("seller");
  if (listings) {
    if (minPrice && maxPrice) {
      listings = listings.filter(listing => listing.usdamount / (listing.bitcloutnanos / 1e9) <= maxPrice && listing.usdamount / (listing.bitcloutnanos / 1e9) >= minPrice)
    }
    if (minVolume && maxVolume) {
      listings = listings.filter(listing => listing.bitcloutnanos/1e9 <= maxVolume && listing.bitcloutnanos/1e9 >= minVolume)
    }
    if (sortArr.includes(priceSort)) {
      if (priceSort === "asc" || priceSort === "ascending" || priceSort === "1") {
        listings.sort((a, b) => {return (a.usdamount / (a.bitcloutnanos/1e9)) - (b.usdamount / (b.bitcloutnanos/1e9))});
      }
      if (priceSort === "desc" || priceSort === "descending" || priceSort === "-1") {
        listings.sort((a, b) => {return (b.usdamount / (b.bitcloutnanos/1e9)) - (a.usdamount / (a.bitcloutnanos/1e9))});
      }
    }
    res.json(listings);
  } else {
    res.status(400).send("listings not found");
  }
});

listingRouter.get("/mylistings", tokenAuthenticator, async (req, res) => {
  //return all user's listings
  const user = await User.findOne({ username: req.user.username }).populate({
    path: "listings",
    populate: { path: "buyer seller" },
  });
  if (user) {
    res.json(user.listings);
  } else {
    res.status(400).send("listings not found");
  }
});

listingRouter.get("/listing/:id", tokenAuthenticator, async (req, res) => {
  //get specific listing
  const listing = await Listing.findOne({ _id: req.params.id }).exec();
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user && listing) {
    if (!listing.completed.status && !listing.ongoing) {
      //if listing has no buyer
      if (user._id == listing.seller.toString()) {
        let popListing = await Listing.findOne({ _id: req.params.id })
          .populate("buyer")
          .populate("seller")
          .exec();
        res.json(popListing);
      } else {
        res.status(403).send("unauthorized request");
      }
    } else if (listing.completed.status || listing.ongoing) {
      if (
        user._id == listing.seller.toString() ||
        user._id == listing!.buyer!.toString()
      ) {
        let popListing = await Listing.findOne({ _id: req.params.id })
          .populate("buyer")
          .populate("seller")
          .exec();
        res.json(popListing);
      } else {
        res.status(403).send("unauthorized request");
      }
    }
  } else {
    res.status(404).send("no listing or user found");
  }
});

export default listingRouter;
