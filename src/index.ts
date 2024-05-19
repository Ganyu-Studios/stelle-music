import "dotenv/config";

import { Logger } from "seyfert";
import { customLogger } from "#stelle/utils/Logger.js";
import { validateEnv } from "#stelle/utils/functions/validateEnv.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

import { Stelle } from "#stelle/client";

const client = new Stelle();

export default client;
