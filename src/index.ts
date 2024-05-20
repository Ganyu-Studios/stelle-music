process.loadEnvFile();

import { Logger } from "seyfert";
import { Stelle } from "#stelle/client";
import { customLogger } from "#stelle/utils/Logger.js";
import { validateEnv } from "#stelle/utils/functions/validateEnv.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export default client;
