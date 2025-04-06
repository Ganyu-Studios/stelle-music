import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { InvalidEnvValue } from "#stelle/utils/errors.js";
import { logger } from "#stelle/utils/functions/logger.js";

/**
 *
 * Validate Stelle environment variables.
 * @throws {InvalidEnvValue} If any of the required environment variables are missing or invalid.
 * @returns {void} Something generic, isn't it?
 */
export function validateEnv(): void {
    logger.info("Looking for '.env' variables...");

    if (Constants.Debug) logger.warn("Running in debug mode.");
    if (Constants.Dev) logger.warn("Running in development mode.");

    if (!Environment.Token) throw new InvalidEnvValue("The variable 'TOKEN' cannot be empty or undefined.");
    if (!Environment.DatabaseUrl) throw new InvalidEnvValue("The variable'DATABASE_URL' cannot be empty or undefined.");
    if (!Environment.ErrorsWebhook) throw new InvalidEnvValue("The variable'ERRORS_WEBHOOK' cannot be empty or undefined.");
    if (!Environment.RedisHost) throw new InvalidEnvValue("The variable'REDIS_HOST' cannot be empty or undefined.");
    if (!Environment.RedisPort) throw new InvalidEnvValue("The variable'REDIS_PORT' cannot be empty or undefined.");
    if (!Environment.RedisPassword) throw new InvalidEnvValue("The variable'REDIS_PASSWORD' cannot be empty or undefined.");

    logger.info("Not able to found missing variables.");
}
