import "dotenv/config";

import { Logger } from "seyfert";
import { Stelle } from "#stelle/client";
import { customLogger } from "#stelle/utils/Logger.js";
import { sendErrorReport } from "#stelle/utils/functions/errors.js";
import { validateEnv } from "#stelle/utils/functions/validations.js";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export default client;

process.on("unhandledRejection", (error) => sendErrorReport({ error }));
process.on("uncaughtException", (error) => sendErrorReport({ error }));
