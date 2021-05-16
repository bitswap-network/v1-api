import { tokenAuthenticator } from "../utils/middleware"
import { genString } from "../utils/functions"
import { completeEmail } from "../utils/mailBody"
import User from "../models/user"
import Transaction from "../models/transaction"
import sendMail from "../utils/mailer"
import { getGasEtherscan, getEthUsdCC, generateHMAC } from "../utils/functions"

const utilRouter = require("express").Router()

utilRouter.get("/getGas", async (req, res) => {
  try {
    const response = await getGasEtherscan()
    if (response.status === 200) {
      res.send(response.data.result)
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.data)
  }
})

utilRouter.get("/pendingtxns", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).exec()
  if (user) {
    if (user.admin) {
      const Txns = await Transaction.find({ status: "pending" }).exec()
      if (Txns) {
        res.status(200).send(Txns)
      } else {
        res.status(500).send("error getting txns")
      }
    } else {
      res.status(403).send("user not admin")
    }
  } else {
    res.status(400).send("user not found")
  }
})

utilRouter.get("/getEthUSD", async (req, res) => {
  try {
    const response = await getEthUsdCC()
    if (response.status === 200) {
      res.send(response.data)
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.data)
  }
})

utilRouter.post("/adminpasswordreset", tokenAuthenticator, async (req, res) => {
  const { username, password } = req.body
  const admin = await User.findOne({ username: req.user.username }).exec()
  const user = await User.findOne({ username: username }).exec()
  if (user && admin) {
    if (admin.admin) {
      user.password = user.generateHash(password)
      user.save((err: any) => {
        if (err) {
          res.status(500).send(err)
        } else {
          res.status(200).send(password)
        }
      })
    } else {
      res.status(403).send("unauthorized")
    }
  } else {
    res.status(400).send("not found")
  }
})

utilRouter.post("/sendcompleteemail", async (req, res) => {
  const { seller, buyer, id } = req.body
  if (seller && buyer && id && req.headers.authorization === "179f7a49640c7004449101b043852736") {
    try {
      const mailBody = completeEmail(id)
      sendMail(seller, mailBody.header, mailBody.body.seller)
      sendMail(buyer, mailBody.header, mailBody.body.buyer)
      res.sendStatus(204)
    } catch (error) {
      res.status(500).send({ error: error.message })
    }
  } else {
    res.status(403).send({ error: "Unauthorized" })
  }
})

export default utilRouter
