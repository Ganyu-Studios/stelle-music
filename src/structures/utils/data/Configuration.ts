import type { StelleConfiguration } from "#stelle/types";
import { ms } from "#stelle/utils/TimeFormat.js";
import { sessions } from "../classes/client/Sessions.js";

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
    resumeTime: ms("1min"),
    developerIds: [
        "391283181665517568", // <-- JustEvil
    ],
    guildIds: [
        "1075885077529120798", // <-- PenwinSquad
        "970508955363188736", // <-- Ganyu Studios
        "1213361742571241492", // <-- Team Genesis
        "1003825077969764412", // <-- Seyfert
    ],
    nodes: sessions.resolve([
        {
            id: "SN #1", // <--- AKA Stelle Node
            host: "localhost",
            port: 2333,
            authorization: "ganyuontopuwu",
            secure: false,
            retryAmount: 10,
            retryDelay: ms("10s"),
        },
    ]),
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
};
