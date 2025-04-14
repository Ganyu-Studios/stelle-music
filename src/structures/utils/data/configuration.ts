import type { StelleConfiguration, StelleEnvironment } from "#stelle/types";
import { Sessions } from "#stelle/utils/manager/sessions.js";

import { ms } from "#stelle/utils/functions/time.js";

// extract the environment variables from the .env file
const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

/**
 * The configuration of the bot.
 * @type {StelleConfiguration}
 */
export const Configuration: StelleConfiguration = {
    defaultLocale: "en-US",
    defaultPrefix: "stelle",
    prefixes: ["st!"],
    fileName: "commands.json",
    cacheSize: 5,
    defaultSearchPlatform: "spotify",
    defaultVolume: 100,
    nodes: Sessions.resolve({
        id: "SN #1", // <--- AKA Stelle Node
        host: "localhost",
        port: 2333,
        authorization: "ganyuontopuwu",
        secure: false,
        retryAmount: 10,
        retryDelay: ms("10s"),
    }),
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
    channels: {
        guildsId: "1061102025548509255", // <-- Guild logs channel,
        errorsId: "1104515104315289640", // <-- Errors logs channel.
    },
    permissions: {
        stagePermissions: ["MuteMembers"],
        voicePermissions: ["ViewChannel", "Connect", "Speak"],
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
    RedisPort: Number(REDIS_PORT),
    RedisPassword: REDIS_PASSWORD,
};
