import { readFile } from "node:fs/promises";
import { getFlag } from "#stelle/utils/functions/utils.js";

import type { AutoplayMode, LoopMode } from "#stelle/types";

const packageJSON = JSON.parse(await readFile("./package.json", "utf-8"));

/**
 * Stelle version.
 */
export const BOT_VERSION: string = packageJSON.version;

/**
 * Stelle bot name.
 */
export const BOT_NAME: string = "Stelle";

/**
 * Check if Stelle is running un DEBUG MODE.
 */
export const DEBUG_MODE: boolean = getFlag("--debug");

/**
 * Stelle eval secrets regex.
 */
export const SECRETS_REGEX = /\b(?:client\.(?:config)|config|env|process\.env|eval|atob|btoa)\b/;

/**
 *
 * Stelle autoplay state.
 * @param boolean
 * @returns
 */
export const AUTOPLAY_TYPE = (boolean: boolean) => {
    const autoplayType: Record<string, AutoplayMode> = {
        true: "enabled",
        false: "disabled",
    };
    return autoplayType[String(boolean)];
};

/**
 *
 * Stelle loop state.
 * @param mode
 * @returns
 */
export const LOOP_STATE = (mode: LoopMode) => {
    const states: Record<LoopMode, LoopMode> = {
        none: "track",
        track: "queue",
        queue: "none",
    };

    return states[mode];
};

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
