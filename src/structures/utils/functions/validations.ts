import { Environment } from "#stelle/data/Configuration.js";
import { DEBUG_MODE, DEV_MODE } from "#stelle/data/Constants.js";
import { InvalidEnvironment } from "#stelle/errors";
import { logger } from "../Logger.js";

/**
 *
 * Validate Stelle environment variables.
 * @returns {void} A function that returns nothing.
 */
export function validateEnv(): void {
    logger.info("Validating '.env' file variables...");

    if (DEBUG_MODE) logger.info("Stelle is running in debug mode.");
    if (DEV_MODE) logger.info("Stelle is running in development mode.");

    if (!Environment.Token) throw new InvalidEnvironment("The variable: 'TOKEN' in the '.env' cannot be empty or undefined.");
    if (!Environment.DatabaseUrl) throw new InvalidEnvironment("The variable: 'DATABASE_URL' in the '.env' cannot be empty or undefined.");
    if (!Environment.ErrorsWebhook)
        throw new InvalidEnvironment("The variable: 'ERRORS_WEBHOOK' in the '.env' cannot be empty or undefined.");

    return logger.info("I'm not able to found missing variables.");
}
