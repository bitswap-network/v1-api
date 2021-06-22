import app from "./app";
import * as config from "./utils/config";
import * as logger from "./utils/logger";

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
process.on("SIGINT", function () {
  logger.info("\nGracefully shutting down from SIGINT (Ctrl-C)");
  process.exit(1);
});
