import app from "./app";
const config = require("./utils/config");
const logger = require("./utils/logger");

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
process.on("SIGINT", function () {
  logger.info("\nGracefully shutting down from SIGINT (Ctrl-C)");
  process.exit(1);
});
