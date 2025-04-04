import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { InvalidEnvironment } from "#stelle/utils/errors.js";
import { logger } from "#stelle/utils/functions/logger.js";

/**
 *
 * Validate Stelle environment variables.
 * @throws {InvalidEnvironment} If any of the required environment variables are missing or invalid.
 * @returns {void} Something generic, isn't it?
 */
export function validateEnv(): void {
    logger.info("Looking for '.env' variables...");

    if (Constants.Debug) logger.warn("Running in debug mode.");
    if (Constants.Dev) logger.warn("Running in development mode.");

    if (!Environment.Token) throw new InvalidEnvironment("The variable 'TOKEN' cannot be empty or undefined.");
    if (!Environment.DatabaseUrl) throw new InvalidEnvironment("The variable'DATABASE_URL' cannot be empty or undefined.");
    if (!Environment.ErrorsWebhook) throw new InvalidEnvironment("The variable'ERRORS_WEBHOOK' cannot be empty or undefined.");
    if (!Environment.RedisHost) throw new InvalidEnvironment("The variable'REDIS_HOST' cannot be empty or undefined.");
    if (!Environment.RedisPort) throw new InvalidEnvironment("The variable'REDIS_PORT' cannot be empty or undefined.");
    if (!Environment.RedisPassword) throw new InvalidEnvironment("The variable'REDIS_PASSWORD' cannot be empty or undefined.");

    return logger.info("I'm not able to found missing variables.");
}
