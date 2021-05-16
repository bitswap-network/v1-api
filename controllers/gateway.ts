import User from "../models/user"
import { tokenAuthenticator } from "../utils/middleware"
import Transaction from "../models/transaction"
import Pool from "../models/pool"
import { getGasEtherscan, generateHMAC } from "../utils/functions"
import { sendAndSubmitBitclout, sendEth } from "../utils/fulfiller"
import { getAndAssignPool, decryptAddress } from "../helpers/pool"
import { getNonce } from "../helpers/web3"
import * as config from "../utils/config"
import axios from "axios"
const gatewayRouter = require("express").Router()

gatewayRouter.post("/deposit/cancel", tokenAuthenticator, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).populate("onGoingDeposit").exec()
  //implement find transaction logic later
  if (user?.onGoingDeposit) {
    const transaction = await Transaction.findById(user.onGoingDeposit._id)
    const pool = await Pool.findOne({ user: user._id }).exec()
    if (pool) {
      pool.active = false
      pool.activeStart = null
      pool.user = null
      await pool.save()
    }
    if (transaction) {
      transaction!.completed = true
      transaction!.completionDate = new Date()
      transaction!.state = "failed"
      transaction!.error = "Deposit Cancelled"
      await transaction.save()
    }
    user.onGoingDeposit = null
    await user.save()
    res.sendStatus(200)
    //find transaction and set to failed
  } else {
    res.status(409).send("No deposit to cancel.")
  }
})

gatewayRouter.post("/deposit/:assetType", tokenAuthenticator, async (req, res) => {
  const { bclt_nanos } = req.body
  const assetType = req.params.assetType
  const user = await User.findOne({ username: req.user.username }).populate("transactions").exec() //use populated transaction tree to check if an ongoing deposit is occuring
  if (user && user.verification.status === "verified" && !user.onGoingDeposit) {
    //not sure if using switch properly
    switch (assetType) {
      case "ETH":
        try {
          const pool_id = await getAndAssignPool(user._id.toString())
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "ETH",
            pool: pool_id,
          })
          user.transactions.push(txn._id)
          user.onGoingDeposit = txn._id
          await user.save()
          await txn.save()
          res.sendStatus(200)
        } catch (e) {
          res.status(500).send(e)
        }
        break
      case "BCLT":
        try {
          const txn = new Transaction({
            user: user._id,
            transactionType: "deposit",
            assetType: "BCLT",
            value: parseInt(bclt_nanos),
          })
          user.onGoingDeposit = txn._id
          user.transactions.push(txn._id)
          await user.save()
          await txn.save()
          res.sendStatus(200)
        } catch (e) {
          res.status(500).send(e)
        }
        break
    }
  } else {
    res.status(400).send("user not found")
  }
})

gatewayRouter.post("/withdraw/:assetType", tokenAuthenticator, async (req, res) => {
  const { value, withdrawAddress } = req.body
  const assetType = req.params.assetType
  const user = await User.findOne({ username: req.user.username }).exec()
  const pool = await Pool.findOne({ balance: { $gt: value } }).exec()
  //should validate gas price on front end
  if (user && user.verification.status === "verified") {
    switch (assetType) {
      case "ETH":
        if (user.balance.ether >= value && pool) {
          try {
            const gas = await getGasEtherscan() // get gas
            const key = decryptAddress(pool.privateKey) // decrypt pool key
            const nonce = await getNonce(pool.address) // get nonce

            user.balance.ether -= value //deduct balance
            const receipt = await sendEth(
              key,
              pool.address,
              withdrawAddress,
              value,
              nonce,
              parseInt(gas.data.result.FastGasPrice.toString())
            ) // receipt object: https://web3js.readthedocs.io/en/v1.3.4/web3-eth.html#eth-gettransactionreceipt-return
            const txn = new Transaction({
              user: user._id,
              transactionType: "withdraw",
              assetType: "ETH",
              completed: true, //set completed to true after transaction goes through?
              txnHash: receipt.transactionHash,
              gasDeducted: parseInt(gas.data.result.FastGasPrice.toString()) / 1e9,
            }) //create withdraw txn object
            user.transactions.push(txn._id) // push txn
            await user.save()
            await txn.save()
            res.sendStatus(200)
          } catch (e) {
            res.status(500).send(e)
          }
        } else {
          res.status(409).send("insufficient balance")
        }
        break
      case "BCLT":
        if (user.balance.bitclout >= value) {
          try {
            const txnHash = await sendAndSubmitBitclout(user.bitclout.publicKey, value)
            const txn = new Transaction({
              user: user._id,
              transactionType: "withdraw",
              assetType: "BCLT",
              completed: true,
              value: parseInt(value),
              txnHash: txnHash,
            })
            user.transactions.push(txn._id)
            await user.save()
            await txn.save()
            res.sendStatus(200)
          } catch (e) {
            res.status(500).send(e)
          }
        } else {
          res.status(409).send("insufficient balance")
        }
        break
    }
  } else {
    res.status(400).send("user not found")
  }
})

gatewayRouter.post("/limit", tokenAuthenticator, async (req, res) => {
  const { orderQuantity, orderPrice, orderSide } = req.body()
  //add verification to check user's balance
  let body = {
    username: req.params.username,
    orderSide: orderSide,
    orderQuantity: orderQuantity,
    orderPrice: orderPrice,
  }
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/limit`, body, {
      headers: { "server-signature": generateHMAC(body) },
    })
    res.status(response.status).send(response.data)
  } catch (e) {
    res.status(500).send(e)
  }
})

gatewayRouter.post("/market", tokenAuthenticator, async (req, res) => {
  const { orderQuantity, orderSide } = req.body()
  //add verification to check user's balance
  let body = {
    username: req.params.username,
    orderSide: orderSide,
    orderQuantity: orderQuantity,
  }
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/market`, body, {
      headers: { "server-signature": generateHMAC(body) },
    })
    res.status(response.status).send(response.data)
  } catch (e) {
    res.status(500).send(e)
  }
})

gatewayRouter.post("/cancel", tokenAuthenticator, async (req, res) => {
  const { orderID } = req.body()
  //add verification to check user's balance
  let body = {
    orderID: orderID,
  }
  try {
    const response = await axios.post(`${config.EXCHANGE_API}/exchange/cancel`, body, {
      headers: { "server-signature": generateHMAC(body) },
    })
    res.status(response.status).send(response.data)
  } catch (e) {
    res.status(500).send(e)
  }
})

export default gatewayRouter
