import { Environment } from "#stelle/utils/data/configuration.js";
import { Constants } from "#stelle/utils/data/constants.js";
import { InvalidEnvValue } from "#stelle/utils/errors.js";
import { logger } from "#stelle/utils/functions/logger.js";
import { convertToSnakeCase, isValid } from "./utils.js";

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

    for (const [key, value] of Object.entries(Environment)) {
        if (!isValid(value))
            throw new InvalidEnvValue(
                `The key '${convertToSnakeCase(key).toUpperCase()}' is not a valid primitive type or is empty, null or undefined.`,
            );
    }

    logger.info("Not able to found missing variables.");
}
