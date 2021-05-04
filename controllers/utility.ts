import { tokenAuthenticator } from "../utils/middleware";
import { genString, completeEmail } from "../utils/functions";
import User from "../models/user";
import Listing from "../models/listing";
import Transaction from "../models/transaction";
import sendMail from "../utils/mailer";
import {
  getGasEtherscan,
  getEthUsdCC,
  getFulfillmentLogs,
  manualFulfillment,
} from "../utils/helper";

const utilRouter = require("express").Router();

utilRouter.get("/getGas", async (req, res) => {
  try {
    const response = await getGasEtherscan();
    if (response.status === 200) {
      res.send(response.data.result);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.data);
  }
});

utilRouter.get("/pendingtxns", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec();
  if (user) {
    if (user.admin) {
      const Txns = await Transaction.find({ status: "pending" }).exec();
      if (Txns) {
        res.status(200).send(Txns);
      } else {
        res.status(500).send("error getting txns");
      }
    } else {
      res.status(403).send("user not admin");
    }
  } else {
    res.status(400).send("user not found");
  }
});

utilRouter.get("/getEthUSD", async (req, res) => {
  try {
    const response = await getEthUsdCC();
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
          const response = await getFulfillmentLogs(req.params.type, body);
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

utilRouter.post("/retry", tokenAuthenticator, async (req, res) => {
  const { listing_id } = req.body;
  try {
    let body = { listing_id: listing_id };
    const response = await manualFulfillment(body);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.log(error.data);
    res.status(500).send(error.data);
  }
});

utilRouter.post("/adminpasswordreset", tokenAuthenticator, async (req, res) => {
  const { username, password } = req.body;
  const admin = await User.findOne({ username: req.user.username }).exec();
  const user = await User.findOne({ username: username }).exec();
  if (user && admin) {
    if (admin.admin) {
      user.password = user.generateHash(password);
      user.save((err: any) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).send(password);
        }
      });
    } else {
      res.status(403).send("unauthorized");
    }
  } else {
    res.status(400).send("not found");
  }
});

utilRouter.post("/sendcompleteemail", async (req, res) => {
  const { seller, buyer, id } = req.body;
  if (
    seller &&
    buyer &&
    id &&
    req.headers.authorization === "179f7a49640c7004449101b043852736"
  ) {
    try {
      let mailBody = completeEmail(id);
      sendMail(seller, mailBody.header, mailBody.body.seller);
      sendMail(buyer, mailBody.header, mailBody.body.buyer);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  } else {
    res.status(403).send({ error: "Unauthorized" });
  }
});

export default utilRouter;
