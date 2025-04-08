import type { StelleConfiguration, StelleEnvironment } from "#stelle/types";

// extract the environment variables from the .env file
const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

/**
 * The configuration of the bot.
 * @type {StelleConfiguration}
 */
export const Configuration: StelleConfiguration = {
    defaultLocale: "en-US",
    inviteLink:
        "https://discord.com/oauth2/authorize?client_id=1241085977544359968&permissions=36793344&integration_type=0&scope=bot+applications.commands",
    githubLink: "https://github.com/Ganyu-Studios/stelle-music",
    developerIds: [
        "391283181665517568", // <-- JustEvil
    ],
    guildIds: [
        "1075885077529120798", // <-- PenwinSquad
        "970508955363188736", // <-- Ganyu Studios
        "1213361742571241492", // <-- Team Genesis
        "1003825077969764412", // <-- Seyfert
    ],
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
