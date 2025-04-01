import "dotenv/config";

import { Logger } from "seyfert";
import { Stelle } from "#stelle/classes/Stelle.js";
import { customLogger } from "./structures/utils/functions/logger.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

export const client = new Stelle();

await client.run();
