import { Environment } from "#stelle/data/Configuration.js";
import { InvalidEnvironment } from "#stelle/errors";
import { Logger } from "seyfert";

const logger = new Logger({
    name: "[ENV]"
});

/**
 *
 * Validate Stelle environment variables.
 * @returns
 */
export function validateEnv() {
    logger.info("Validating '.env' file variables...");

    if (!Environment.Token) {
        throw new InvalidEnvironment("The variable: 'TOKEN' in the '.env' cannot be empty or undefined.");
    }
    if (!Environment.DatabaseUrl) {
        throw new InvalidEnvironment("The variable: 'DATABASE_URL' in the '.env' cannot be empty or undefined.");
    }
    if (!Environment.ErrorsWebhook) {
        throw new InvalidEnvironment("The variable: 'ERRORS_WEBHOOK' in the '.env' cannot be empty or undefined.");
    }

    logger.info("I'm not able to found missing variables.");
}
