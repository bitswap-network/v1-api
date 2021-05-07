import Pool from "../models/pool"
import { verifyAlchemySignature } from "../utils/functions"
import { processDeposit } from "../helpers/pool"

const webhookRouter = require("express").Router()

webhookRouter.post("/escrow", async (req, res) => {
  if (verifyAlchemySignature(req)) {
    const { fromAddress, toAddress, value, asset, hash } = req.body.activity[0]
    // If the transaction is successfully sent from the wallet
    // Mark the listing as completed
    // Transaction is sent to the wallet
    try {
      const pool = await Pool.findOne({
        address: toAddress.toLowerCase(),
      }).exec()

      if (pool) {
        pool.balance += value
        await pool.save()
        if (pool.active) {
          processDeposit(pool._id, value, asset, hash)
          res.sendStatus(204)
        } else {
          console.log("sent to inactive pool")
          res.sendStatus(400)
        }
      }
    } catch (error) {
      console.log(error)
      res.sendStatus(error)
    }
  }
})

export default webhookRouter
