import type { StelleConfiguration, StelleEnvironment } from "#stelle/types";

const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

/**
 * The configuration of the bot.
 * @type {StelleConfiguration}
 */
export const Configuration: StelleConfiguration = {
    defaultLocale: "en-US",
    color: {
        success: 0x8d86a8,
        extra: 0xece8f1,
    },
    commands: {
        defaultPrefix: "stelle",
        prefixes: ["st!"],
        reply: true,
        filename: "commands.json",
    },
};

/**
 * The environment variables.
 * @type {StelleEnvironment}
 */
export const Environment: StelleEnvironment = {
    Token: TOKEN,
    DatabaseUrl: DATABASE_URL,
    ErrorsWebhook: ERRORS_WEBHOOK,
    RedisHost: REDIS_HOST,
    RedisPort: REDIS_PORT,
    RedisPassword: REDIS_PASSWORD,
};
