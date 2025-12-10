import "dotenv/config";

import { Configuration } from "#stelle/utils/data/configuration.js";
import { getWatermark } from "#stelle/utils/functions/logger.js";

// The configuration now is dynamically loaded, so we need to call it first.
await Configuration.load();

getWatermark();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/Stelle.js";
import { customLogger } from "#stelle/utils/functions/logger.js";
import { cleanup } from "#stelle/utils/functions/utils.js";
import { validateEnv } from "#stelle/utils/functions/validate.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export { client };

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();

process.on("SIGINT", cleanup.bind(client));
process.on("SIGTERM", cleanup.bind(client));
