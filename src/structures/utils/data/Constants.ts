import { readFile } from "node:fs/promises";

import { ActivityType, type GatewayActivityUpdateData } from "seyfert/lib/types/index.js";

const packageJSON = JSON.parse(await readFile("./package.json", "utf-8"));

/**
 * Stelle version.
 */
export const BOT_VERSION: string = packageJSON.version;

/**
 * Check if Stelle is running in DEBUG MODE.
 */
export const DEBUG_MODE: boolean = process.argv.includes("--debug");

/**
 * Check if Stelle is running in DEV MODE.
 */
export const DEV_MODE: boolean = process.argv.includes("--dev");

/**
 * Stelle think messages.
 */
export const THINK_MESSAGES: string[] = [
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

/**
 * Stelle eval secrets messages.
 */
export const SECRETS_MESSAGES: string[] = [
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

/**
 * Stelle presence activities.
 */
export const BOT_ACTIVITIES: GatewayActivityUpdateData[] = [
    { name: "the Space. 🌠", type: ActivityType.Listening },
    { name: `v${BOT_VERSION}. 🐐`, type: ActivityType.Listening },
    { name: "with {users} users. 🎧", type: ActivityType.Listening },
    { name: "in {guilds} guilds. ❤️", type: ActivityType.Streaming },
    { name: "with {users} users. 👤", type: ActivityType.Playing },
    { name: "{players} players. 🌐", type: ActivityType.Watching },
];
