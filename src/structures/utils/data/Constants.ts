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
