import "dotenv/config";

import { Configuration } from "#stelle/utils/data/configuration.js";
import { getWatermark } from "#stelle/utils/functions/internal/logger.js";

// The configuration now is dynamically loaded, so we need to call it first.
await Configuration.load();

getWatermark();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/Stelle.js";
import { customLogger } from "#stelle/utils/functions/internal/logger.js";
import { cleanup } from "#stelle/utils/functions/internal/utils.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

const client = new Stelle();

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();

process.on("SIGINT", (): void => cleanup(client));
process.on("SIGTERM", (): void => cleanup(client));
