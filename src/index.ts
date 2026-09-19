import "dotenv/config";

import { Structures } from "hoshimi";
import { HoshimiLyricsManager } from "#stelle/classes/manager/LyricsManager.js";
import { Configuration } from "#stelle/utils/data/configuration.js";
import { LoggerOps } from "#stelle/utils/functions/internal/logger.js";

// The configuration now is dynamically loaded, so we need to call it first.
await Configuration.load();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/client/Stelle.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

// Override the default LyricsManager with our custom implementation.
Structures.LyricsManager = (...args) => new HoshimiLyricsManager(...args);

Logger.customize(LoggerOps.custom);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

const client = new Stelle();

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();

process.on("SIGINT", (): void => UtilsOps.cleanup(client));
process.on("SIGTERM", (): void => UtilsOps.cleanup(client));
