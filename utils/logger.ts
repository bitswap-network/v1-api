import * as config from "./config"
const Rollbar = require("rollbar")
Rollbar.configure({ logLevel: "info" })
const rollbar = new Rollbar({
  accessToken: config.ROLLBAR,
  captureUncaught: true,
  captureUnhandledRejections: true,
})
export const critical = (...params) => {
  rollbar.critical(...params)
  console.error(...params)
}
export const error = (...params) => {
  rollbar.error(...params)
  console.error(...params)
}

export const warning = (...params) => {
  rollbar.warning(...params)
  console.error(...params)
}
export const info = (...params) => {
  console.log(...params)
}
