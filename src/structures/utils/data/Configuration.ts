import type { StelleConfiguration } from "#stelle/types";
import { ms } from "#stelle/utils/TimeFormat.js";

export const Configuration: StelleConfiguration = {
    defaultPrefix: "stelle",
    defaultVolume: 60,
    cachePath: "commands.json",
    defaultSearchEngine: "spotify",
    prefixes: ["st!"],
    defaultLocale: "en-US",
    disconnectTime: ms("30s"),
    maxCache: 5,
    developerIds: [
        "391283181665517568", // <-- JustEvil
    ],
    guildIds: [
        "1075885077529120798", // <-- PenwinSquad
        "970508955363188736", // <-- Ganyu Studios
    ],
    nodes: [
        {
            id: "SN #1", // <--- AKA Stelle Node
            host: "localhost",
            port: 2333,
            authorization: "ganyuontopuwu",
            secure: false,
            retryAmount: 10,
            retryDelay: ms("10s"),
        },
    ],
    color: {
        success: 0x8d86a8,
        extra: 0xece8f1,
    },
};
