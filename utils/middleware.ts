const logger = require("./logger")
const config = require("./config")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const ExpressBrute = require("express-brute")
const MongooseStore = require("express-brute-mongoose")
const BruteForceSchema = require("express-brute-mongoose/dist/schema")

const bruteforce_model = mongoose.model("bruteforce", new mongoose.Schema(BruteForceSchema))
const store = new MongooseStore(bruteforce_model)
export const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
})

const Rollbar = require("rollbar")
const rollbar = new Rollbar({
  accessToken: config.ROLLBAR,
  captureUncaught: true,
  captureUnhandledRejections: true,
})

export const requestLogger = (request, response, next) => {
  rollbar.info(request)
  console.log("Method:", request.method)
  console.log("Path:  ", request.path)
  console.log("Header:  ", request.header)
  if (request.path === "/auth/login" || request.path === "/auth/register") {
    console.log("Body Filtered")
  } else {
    console.log("Body:  ", request.body)
  }
  console.log("---")
  next()
}

export const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

export const errorHandler = (error, request, response, next) => {
  console.error(error)

  if (error.name === "CastError" && error.kind === "ObjectId") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

export const tokenAuthenticator = (request, response, next) => {
  const authHeader = request.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return response.status(401).send("Missing token")

  jwt.verify(token, config.SECRET, (err, user) => {
    if (err) return response.status(403).send("Invalid token")

    request.user = user

    next()
  })
}
