import { tokenAuthenticator } from "../utils/middleware";
import { generateHMAC, genString } from "../utils/functions";
import * as config from "../utils/config";
import axios from "axios";
import User from "../models/user";
import Listing from "../models/listing";

const utilRouter = require("express").Router();

utilRouter.get("/getGas", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${config.ETHERSCAN_KEY}`
    );
    if (response.status === 200) {
      res.send(response.data.result);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

utilRouter.get("/getEthUSD", async (req, res) => {
  try {
    const response = await axios.get(
      `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD`,
      {
        headers: { Authorization: `Apikey ${config.CRYPTOCOMPARE_KEY}` },
      }
    );
    if (response.status === 200) {
      res.send(response.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

utilRouter.get("/logging/:type", tokenAuthenticator, async (req, res) => {
  let types = ["combined", "out", "error"];
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    if (user.admin) {
      if (types.includes(req.params.type)) {
        try {
          let body = { id: genString(32) };
          const response = await axios.post(
            `${config.FULFILLMENT_API}/logs/${req.params.type}`,
            body,
            {
              headers: { "server-signature": generateHMAC(body) },
            }
          );
          if (response.status === 200) {
            res.send(response.data);
          }
        } catch (error) {
          console.log(error.data);
          res.status(500).send(error.data);
        }
      } else {
        res
          .status(400)
          .send(`Request param must be one of: ${types.join(", ")}`);
      }
    } else {
      res.status(403).send("unauthorized: user must be admin");
    }
  } else {
    res.status(400).send("user not found");
  }
});

utilRouter.get("/totalcompleted", async (req, res) => {
  const listings = await Listing.find({
    "completed.status": true,
  }).exec();
  let totalbitcloutnanos = 0;
  let totaletheramount = 0;
  listings.forEach((listing) => {
    totalbitcloutnanos += listing.bitcloutnanos;
    totaletheramount += listing.etheramount;
  });
  res.send({
    count: listings.length,
    totalbitcloutnanos: totalbitcloutnanos,
    totaletheramount: totaletheramount,
  });
});

utilRouter.get("/avgprice", async (req, res) => {
  const limit = !isNaN(Number(req.query.limit)) ? Number(req.query.limit) : 50;
  const listings = await Listing.find({
    "completed.status": true,
  })
    .sort({
      "completed.date": "descending",
    })
    .limit(limit)
    .exec();
  let total = 0;
  listings.forEach((listing) => {
    total += listing.usdamount / (listing.bitcloutnanos / 1e9);
  });
  res.send({
    count: listings.length,
    avgprice: total / listings.length,
  });
});

export default utilRouter;
