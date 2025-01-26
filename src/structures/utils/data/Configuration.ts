import { StelleSessions } from "#stelle/classes";
import type { StelleConfiguration, StelleEnvironment } from "#stelle/types";
import { ms } from "#stelle/utils/Time.js";

const { TOKEN, DATABASE_URL, ERRORS_WEBHOOK, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

/**
 * Stelle environment.
 */
export const Environment: StelleEnvironment = {
    Token: TOKEN,
    DatabaseUrl: DATABASE_URL,
    ErrorsWebhook: ERRORS_WEBHOOK,
    RedisHost: REDIS_HOST,
    RedisPort: Number(REDIS_PORT),
    RedisPassword: REDIS_PASSWORD,
};

/**
 * Stelle configuration.
 */
export const Configuration: StelleConfiguration = {
    defaultPrefix: "stelle",
    defaultVolume: 60,
    defaultSearchEngine: "spotify",
    prefixes: ["st!"],
    defaultLocale: "en-US",
    disconnectTime: ms("30s"),
    lyricsLines: 11,
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
    nodes: StelleSessions.resolve({
        id: "SN #1", // <--- AKA Stelle Node
        host: "localhost",
        port: 2333,
        authorization: "ganyuontopuwu",
        secure: false,
        retryAmount: 10,
        retryDelay: ms("10s"),
    }),
    color: {
        success: 0x8d86a8,
        extra: 0xece8f1,
    },
    channels: {
        guildsId: "1061102025548509255", // <-- Added / Removed guilds channel,
        errorsId: "1104515104315289640", // <-- Errors channel.
    },
    cache: {
        filename: "commands.json",
        size: 5,
    },
    sessions: {
        enabled: true,
        resumeTime: ms("1min"),
        resumePlayers: true,
    },
    permissions: {
        stagePermissions: ["MuteMembers"],
        voicePermissions: ["ViewChannel", "Connect", "Speak"],
    },
};
