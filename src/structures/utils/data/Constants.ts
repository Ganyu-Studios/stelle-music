import { readFile } from "node:fs/promises";
import { getFlag } from "../functions/utils.js";

const packageJSON = await JSON.parse(await readFile("./package.json", "utf-8"));

/**
 * Stelle version.
 */
export const BOT_VERSION: string = packageJSON.version;

/**
 * Check if Stelle is running un DEBUG MODE.
 */
export const DEBUG_MODE: boolean = getFlag("--debug");

export const THINK_MESSAGES = [
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
