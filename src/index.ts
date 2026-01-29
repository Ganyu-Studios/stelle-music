import "dotenv/config";

import { Configuration } from "#stelle/utils/data/configuration.js";
import { getWatermark } from "#stelle/utils/functions/internal/logger.js";

// The configuration now is dynamically loaded, so we need to call it first.
await Configuration.load();

getWatermark();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/Stelle.js";
import { customLogger } from "#stelle/utils/functions/internal/logger.js";
import { validateEnv } from "#stelle/utils/functions/internal/validate.js";
import { cleanup } from "#stelle/utils/functions/utils.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export { client };

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();

process.on("SIGINT", () => cleanup(client));
process.on("SIGTERM", () => cleanup(client));
