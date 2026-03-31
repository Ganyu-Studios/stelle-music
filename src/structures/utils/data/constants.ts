import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { LoopMode } from "hoshimi";
import type { GatewayActivityUpdateData } from "seyfert/lib/types/gateway.js";
import { ActivityType } from "seyfert/lib/types/index.js";
import type { AutoplayState, PausedState, StelleConstants, WorkingDirectory } from "#stelle/types";
import { Environment } from "./configuration.js";

// funny thing, it sucks, but it works.
const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf-8"));

/**
 * The constants of the bot.
 * @type {StelleConstants}
 */
export const Constants: StelleConstants = {
    CachePath: "./cache",
    CommandsFile: "./commands.json",
    SessionsFile: "./sessions.json",
    Version: packageJson.version,
    Dev: process.argv.includes("--dev"),
    Debug: process.argv.includes("--debug"),
    PauseState(state): PausedState {
        return state ? "resume" : "pause";
    },
    AutoplayState(state): AutoplayState {
        return state ? "enabled" : "disabled";
    },
    WorkingDirectory(): WorkingDirectory {
        return this.Dev ? "src" : "dist";
    },
    GetNamespace(): string {
        return this.Dev ? "internal" : "stellequeue";
    },
    ThinkMessage(): string {
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
    SecretMessage(): string {
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
    Activities(options = { guilds: 0, users: 0, players: 0 }): GatewayActivityUpdateData[] {
        const { users, guilds, players } = options;
        return [
            { name: "the Space. 🌠", type: ActivityType.Listening },
            { name: `v${this.Version}. 🐐`, type: ActivityType.Listening },
            { name: `with ${users} users. 🎧`, type: ActivityType.Listening },
            { name: `in ${guilds} guilds. ❤️`, type: ActivityType.Streaming },
            { name: `with ${users} users. 👤`, type: ActivityType.Playing },
            { name: `${players} players. 🌐`, type: ActivityType.Watching },
            { name: "with /help 📜", type: ActivityType.Playing },
        ];
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
    GetRedisUrl(): string {
        const host: string = Environment.REDIS_HOST;
        const port: number = Environment.REDIS_PORT;
        const password: string = Environment.REDIS_PASSWORD;
        const username: string = Environment.REDIS_USERNAME;

        const protocol: "rediss" | "redis" = Environment.REDIS_SECURE ? "rediss" : "redis";

        return `${protocol}://${username}:${password}@${host}:${port}`;
    },
    GetCachePath(): string {
        return join(process.cwd(), this.CachePath, this.CommandsFile);
    },
};
