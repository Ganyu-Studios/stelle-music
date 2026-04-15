import type { LoopMode } from "hoshimi";
import type { GatewayActivityUpdateData } from "seyfert/lib/types/gateway.js";

/**
 * The options for the presence activity.
 */
interface ActivityOptions {
    /**
     * The number of guilds.
     * @type {number}
     */
    guilds: number;
    /**
     * The number of users.
     * @type {number}
     */
    users: number;
    /**
     * The number of players.
     * @type {number}
     */
    players: number;
}

/**
 * The type of the working directory of the bot.
 */
export type WorkingDirectory = "src" | "dist";

/**
 * The type of the paused state of the player.
 */
export type PausedState = "pause" | "resume";

/**
 * The type of the autoplay state of the player.
 */
export type AutoplayState = "enabled" | "disabled";

/**
 * The constants interface.
 */
export interface StelleConstants {
    /**
     * The current version of Stelle.
     * @type {string}
     */
    readonly Version: string;
    /**
     * Check if the bot is running in development mode. (Only if the flag is provided.)
     * @type {boolean}
     * @default false
     */
    readonly Dev: boolean;
    /**
     * Check if the bot is running in production mode. (Only if the flag is provided.)
     * @type {boolean}
     * @default false
     */
    readonly Debug: boolean;
    /**
     * The cache path where the bot stores its cache files.
     * @type {string}
     * @default "./cache"
     */
    readonly CachePath: string;
    /**
     * The filename to save the commands cache.
     * @type {string}
     * @default "commands.json"
     */
    readonly CommandsFile: `${string}.json`;
    /**
     * The filename to save the sessions cache.
     * @type {string}
     * @default "sessions.json"
     */
    readonly SessionsFile: `${string}.json`;
    /**
     * An array of activities to be used in the presence.
     * @param {ActivityOptions} options The options for the activity.
     * @type {GatewayActivityUpdateData[]}
     * @returns {GatewayActivityUpdateData[]} An array of activities.
     */
    Activities(options?: ActivityOptions): GatewayActivityUpdateData[];
    /**
     * Get a random message from the list of messages.
     * @returns {string} A random message.
     */
    ThinkMessage(): string;
    /**
     * Get a random message from the list of messages.
     * @returns {string} A random message.
     */
    SecretMessage(): string;
    /**
     * Get the current working directory of the bot. (By default, it's obtained from the `Dev` property.)
     * @returns {WorkingDirectory} The current working directory of the bot.
     */
    WorkingDirectory(): WorkingDirectory;
    /**
     *
     * Get the autoplay state of the player.
     * @param {boolean} state Whether the autoplay is enabled or not.
     */
    AutoplayState(state: boolean): AutoplayState;
    /**
     * Get the paused state of the player.
     * @param {boolean} state Whether the autoplay is enabled or not.
     */
    PauseState(state: boolean): PausedState;
    /**
     * Get the loop state of the player.
     * @param {LoopMode} mode The loop mode of the player.
     * @param {boolean} alt Whether to use the alternative mode or not.
     */
    LoopMode(mode: LoopMode, alt?: boolean): LoopMode;
    /**
     * Get the name space for the Redis keys.
     * @returns {string} The name space for the Redis keys.
     */
    GetNamespace(): string;
    /**
     * Get the Redis URL from the environment variables.
     * @returns {string} The Redis URL.
     */
    GetRedisUrl(): string;
    /**
     * Get the filename to save the commands cache.
     * @returns {string} The filename to save the commands cache.
     */
    GetCachePath(): string;
}
