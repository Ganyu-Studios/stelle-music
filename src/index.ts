import "dotenv/config";

import { getWatermark } from "#stelle/utils/functions/logger.js";

getWatermark();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/Stelle.js";
import { validateEnv } from "#stelle/utils/functions/validate.js";
import { customLogger } from "./structures/utils/functions/logger.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export { client };

// "Warning: Detected unsettled top-level await" my ass
(async (): Promise<void> => await client.run())();
