const listingRouter = require("express").Router();
const Listing = require("../models/listing");
const { tokenAuthenticator } = require("../utils/middleware");
const logger = require("./utils/logger");
const config = require("./utils/config");

listingRouter.get("/profile", tokenAuthenticator, (req, res) => {});

listingRouter.get("/profile/:username", tokenAuthenticator, (req, res) => {});

export default listingRouter;
