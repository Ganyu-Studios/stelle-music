import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { LoadableStelleConfiguration, StelleConfiguration, StelleEnvironment } from "#stelle/types";
import { InvalidConfiguration } from "#stelle/utils/errors.js";

// extract the environment variables from the .env file
const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME } = process.env;

/**
 * The flag to check if the configuration is initialized.
 * @type {boolean}
 */
let isInitialized: boolean = false;

/**
 * The configuration of the bot.
 * @type {StelleConfiguration}
 */
//@ts-expect-error The configuration is dynamically loaded.
export const Configuration: LoadableStelleConfiguration = {
    async load(): Promise<void> {
        if (isInitialized) return;

        // *cries in cocogoat*
        const { BaseClient } = await import("seyfert/lib/client/base.js");

        const directory: string = await BaseClient.prototype.getRC().then((i) => i.locations.config);
        const filenames: string[] = ["local.config", "default.config"];
        const extensions: string[] = [".js", ".ts"];

        let isFound: boolean = false;

        for (const filename of filenames) {
            for (const ext of extensions) {
                const file = join(directory, `${filename}${ext}`);

                const i: StelleConfiguration | null = await import(`${pathToFileURL(file)}`)
                    .then((i) => i.default ?? i)
                    .catch((error) => {
                        if (error.stack.includes("ERR_MODULE_NOT_FOUND"))
                            throw new InvalidConfiguration(
                                `The config file '${filename}' does not exist. Please create it or check the path.`,
                            );

                        throw error;
                    });

                if (!i || (typeof i === "object" && !Object.keys(i).length)) continue;

                Object.assign(this, i);
                isFound = true;

                break;
            }

            if (isFound) break;
        }

        if (!isFound)
            throw new InvalidConfiguration(`No config file found in '/config/' with any of the filenames: \n- ${filenames.join("\n- ")}`);

        isInitialized = true;
    },
};

/**
 * Creates a new configuration object.
 * @param {StelleConfiguration} data The configuration data.
 * @returns {StelleConfiguration} The new configuration object.
 */
export const createConfig = (data: StelleConfiguration): StelleConfiguration => data;

/**
 * The environment variables.
 * @type {StelleEnvironment}
 */
export const Environment: StelleEnvironment = {
    Token: TOKEN,
    DatabaseUrl: DATABASE_URL,
    ErrorsWebhook: ERRORS_WEBHOOK,
    RedisHost: REDIS_HOST ?? "localhost",
    RedisPort: Number(REDIS_PORT ?? 6379),
    RedisPassword: REDIS_PASSWORD,
    RedisUsername: REDIS_USERNAME ?? "default",
};
