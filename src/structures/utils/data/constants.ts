import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { LoopMode } from "hoshimi";
import type { GatewayActivityUpdateData } from "seyfert/lib/types/gateway.js";
import { ActivityType } from "seyfert/lib/types/index.js";
import type {
    AutoplayState,
    ConstantsMeta,
    ConstantsMusic,
    ConstantsPaths,
    ConstantsPresence,
    ConstantsRedis,
    ConstantsText,
    OutputDirectory,
    PausedState,
} from "#stelle/types";
import { Environment } from "./configuration.js";

/**
 * The type of the package.json file.
 */
type PackageJSON = typeof import("../../../../package.json");

/**
 * The package.json file of the bot, parsed as JSON.
 * @type {PackageJSON}
 */
// funny thing, it sucks, but it works.
const packageJson: PackageJSON = JSON.parse(await readFile(resolve("package.json"), "utf-8"));

/**
 * The version of Seyfert that the bot is using.
 * @type {string}
 */
const seyfert: string = packageJson.dependencies?.seyfert ?? "unknown";

/**
 * The bot's metadata (version and mode flags).
 * @type {ConstantsMeta}
 */
export const StelleMeta: ConstantsMeta = {
    Version: packageJson.version,
    Node: process.version,
    Seyfert: seyfert.replace(/^[\^~]/, ""),
    Dev: process.argv.includes("--dev"),
    Debug: process.argv.includes("--debug"),
};

/**
 * The bot's filesystem paths and their derived resolvers.
 * @type {ConstantsPaths}
 */
export const StellePaths: ConstantsPaths = {
    CachePath: "./cache",
    CommandsFile: "./commands.json",
    SessionsFile: "./sessions.json",
    GetOutDirectory(): OutputDirectory {
        return StelleMeta.Dev ? "src" : "dist";
    },
    GetCacheDirectory(): string {
        return join(process.cwd(), StellePaths.CachePath, StellePaths.CommandsFile);
    },
};

/**
 * The bot's flavor text.
 * @type {ConstantsText}
 */
export const StelleText: ConstantsText = {
    Think(): string {
        const messages: string[] = [
            "is thinking...",
            "is stargazing...",
            "is astral pondering...",
            "is charting a course...",
            "is cosmic contemplating...",
            "is navigating the cosmos...",
            "is starbound thinking...",
            "is exploring the void...",
            "is celestial pondering...",
            "is interstellar musing...",
            "is star searching...",
            "is galactic contemplating...",
            "is stellar considering...",
            "is spacebound reflecting...",
            "is nebulae pondering...",
            "is lunar musing...",
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    },
    Secret(): string {
        const messages: string[] = [
            "That's... restricted information...",
            "Hey! You can't see that.",
            "Don't you have better things to do?",
            "No, I won't let you see that...",
            "That information, is private...",
            "Hey! Mind your business...",
            "I'm getting bored of this....",
            "ENOUGH!",
            "I'm serious... I'm tired...",
            "...",
            "I will restrict you if you continue...",
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    },
};

/**
 * The bot's presence activities.
 * @type {ConstantsPresence}
 */
export const StellePresence: ConstantsPresence = {
    Activities(options = { guilds: 0, users: 0, players: 0 }): GatewayActivityUpdateData[] {
        const { users, guilds, players } = options;
        return [
            { name: "the Space. 🌠", type: ActivityType.Listening },
            { name: `v${StelleMeta.Version}. 🐐`, type: ActivityType.Listening },
            { name: `with ${users} users. 🎧`, type: ActivityType.Listening },
            { name: `in ${guilds} guilds. ❤️`, type: ActivityType.Streaming },
            { name: `with ${users} users. 👤`, type: ActivityType.Playing },
            { name: `${players} players. 🌐`, type: ActivityType.Watching },
            { name: "with /help 📜", type: ActivityType.Playing },
        ];
    },
};

/**
 * The bot's music-domain state helpers.
 * @type {ConstantsMusic}
 */
export const StelleMusic: ConstantsMusic = {
    AutoplayState(state): AutoplayState {
        return state ? "enabled" : "disabled";
    },
    PauseState(state): PausedState {
        return state ? "resume" : "pause";
    },
    LoopMode(mode, alt): LoopMode {
        const states: Record<LoopMode, LoopMode> = {
            [LoopMode.Off]: LoopMode.Track,
            [LoopMode.Track]: LoopMode.Queue,
            [LoopMode.Queue]: LoopMode.Off,
        };

        if (alt) {
            states[LoopMode.Off] = LoopMode.Off;
            states[LoopMode.Track] = LoopMode.Track;
            states[LoopMode.Queue] = LoopMode.Queue;
        }

        return states[mode];
    },
};

/**
 * The bot's Redis connection helpers.
 * @type {ConstantsRedis}
 */
export const StelleRedis: ConstantsRedis = {
    GetUrl(): string {
        const host: string = Environment.REDIS_HOST;
        const port: number = Environment.REDIS_PORT;
        const password: string = Environment.REDIS_PASSWORD;
        const username: string = Environment.REDIS_USERNAME;

        const protocol: "rediss" | "redis" = Environment.REDIS_SECURE ? "rediss" : "redis";

        return `${protocol}://${username}:${password}@${host}:${port}`;
    },
    GetNamespace(): string {
        return StelleMeta.Dev ? "internal" : "stellequeue";
    },
};
