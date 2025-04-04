import type { GatewayActivityUpdateData } from "seyfert/lib/types/gateway.js";
import type { StelleConstants, StelleDirectory } from "#stelle/types";

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ActivityType } from "seyfert/lib/types/index.js";

// funny thing
const packageJson = await import(pathToFileURL(resolve(process.cwd(), "package.json")).toString(), { assert: { type: "json" } });

/**
 * The constants for Stelle.
 * @type {StelleConstants}
 */
export const Constants: StelleConstants = {
    Version: packageJson.version,
    Dev: process.argv.includes("--dev"),
    Debug: process.argv.includes("--debug"),
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
        ];
    },
    WorkingDirectory(): StelleDirectory {
        return this.Dev ? "src" : "dist";
    },
};
