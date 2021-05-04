const listingRouter = require("express").Router();
import Listing from "../models/listing";
import User from "../models/user";
import { getEthUsdCC } from "../utils/helper";
import sendMail from "../utils/mailer";
import { transactionNotificationEmail } from "../utils/functions";
const { tokenAuthenticator } = require("../utils/middleware");

listingRouter.post("/create", tokenAuthenticator, async (req, res) => {
  const { bitcloutnanos, usdamount, etheramount, ethaddress } = req.body;
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

      await getEthUsdCC()
        .then((response) => {
          listing.etheramount = listing.usdamount / response.data.USD;
          listing.save((err: any) => {
            if (err) {
              res.status(500).send("error saving listing");
            } else {
              buyer.buystate = true;
              buyer.buys.push(listing._id);
              buyer.save((err: any) => {
                if (err) {
                  res.status(500).send("error saving user");
                } else {
                  try {
                    let mailBody = transactionNotificationEmail(
                      buyer.username,
                      listing._id
                    );
                    sendMail(seller.email, mailBody.header, mailBody.body);
                    res.sendStatus(200);
                  } catch (err) {
                    res.status(500).send(err);
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send(error);
        });
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
  const dateSort = req.query.dateSort;
  const volumeSort = req.query.volumeSort;
  const priceSort = req.query.priceSort;

  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const minVolume = req.query.minVolume;
  const maxVolume = req.query.maxVolume;
  const resultsCount = req.query.count;

  let sortOptions = {};

  if (sortArr.includes(dateSort)) {
    sortOptions["created"] = dateSort;
  }

  if (sortArr.includes(volumeSort)) {
    sortOptions["bitcloutnanos"] = volumeSort;
  }

  let listings = await Listing.find({
    ongoing: false,
    "completed.status": false,
  })
    .sort(sortOptions)
    .limit(resultsCount)
    .populate("buyer")
    .populate("seller")
    .exec();

  if (listings.length > 0) {
    if (
      minPrice &&
      maxPrice &&
      minPrice !== "undefined" &&
      maxPrice !== "undefined"
    ) {
      listings = listings.filter(
        (listing) =>
          listing.usdamount / (listing.bitcloutnanos / 1e9) <= maxPrice &&
          listing.usdamount / (listing.bitcloutnanos / 1e9) >= minPrice
      );
    }
    if (
      minVolume &&
      maxVolume &&
      minVolume !== "undefined" &&
      maxVolume !== "undefined"
    ) {
      listings = listings.filter(
        (listing) =>
          listing.bitcloutnanos / 1e9 <= maxVolume &&
          listing.bitcloutnanos / 1e9 >= minVolume
      );
    }
    if (sortArr.includes(priceSort)) {
      if (
        priceSort === "asc" ||
        priceSort === "ascending" ||
        priceSort === "1"
      ) {
        listings.sort((a, b) => {
          return (
            a.usdamount / (a.bitcloutnanos / 1e9) -
            b.usdamount / (b.bitcloutnanos / 1e9)
          );
        });
      }
      if (
        priceSort === "desc" ||
        priceSort === "descending" ||
        priceSort === "-1"
      ) {
        listings.sort((a, b) => {
          return (
            b.usdamount / (b.bitcloutnanos / 1e9) -
            a.usdamount / (a.bitcloutnanos / 1e9)
          );
        });
      }
    }
    res.json(listings);
  } else {
    res.status(400).send("no listings found");
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
      if (user._id == listing.seller.toString() || user.admin) {
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
        user._id == listing!.buyer!.toString() ||
        user.admin
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
