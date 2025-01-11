import "dotenv/config";
import { validateEnv } from "#stelle/utils/functions/validations.js";
import { sendErrorReport } from "#stelle/utils/functions/errors.js";
import { customLogger } from "#stelle/utils/Logger.js";
import { Stelle } from "#stelle/client";
import { Logger } from "seyfert";

Logger.customize(customLogger);
Logger.saveOnFile = "all";
Logger.dirname = "logs";

validateEnv();

const client = new Stelle();

export default client;

process.on("unhandledRejection", (error) => sendErrorReport({ error }));
process.on("uncaughtException", (error) => sendErrorReport({ error }));
