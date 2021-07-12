import app from "./app";
import * as config from "./config";
import * as logger from "./utils/logger";
import { patchUserBalances } from "./helpers/wallet";
app.listen(config.PORT, () => {
  // patchUserBalances()
  logger.info(`Server running on port ${config.PORT}`);
});
process.on("SIGINT", function () {
  logger.info("\nGracefully shutting down from SIGINT (Ctrl-C)");
  process.exit(1);
});
