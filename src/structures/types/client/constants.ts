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
 * The bot's metadata (version and mode flags).
 */
export interface ConstantsMeta {
    /**
     * The current version of Stelle.
     * @type {string}
     */
    readonly Version: string;
    /**
     * The Node.js version the bot is running on.
     * @type {string}
     */
    readonly Node: string;
    /**
     * The version of Seyfert the bot is using.
     * @type {string}
     */
    readonly Seyfert: string;
    /**
     * Whether the bot is running in development mode. (Only if the `--dev` flag is provided.)
     * @type {boolean}
     * @default false
     */
    readonly Dev: boolean;
    /**
     * Whether the bot is running in debug mode. (Only if the `--debug` flag is provided.)
     * @type {boolean}
     * @default false
     */
    readonly Debug: boolean;
}

/**
 * The bot's filesystem paths and their derived resolvers.
 */
export interface ConstantsPaths {
    /**
     * The cache path where the bot stores its cache files.
     * @type {string}
     * @default "./cache"
     */
    readonly CachePath: string;
    /**
     * The filename to save the commands cache.
     * @type {`${string}.json`}
     * @default "commands.json"
     */
    readonly CommandsFile: `${string}.json`;
    /**
     * The filename to save the sessions cache.
     * @type {`${string}.json`}
     * @default "sessions.json"
     */
    readonly SessionsFile: `${string}.json`;
    /**
     * Get the current working directory of the bot. (By default, derived from `StelleMeta.Dev`.)
     * @returns {WorkingDirectory} The current working directory of the bot.
     */
    WorkingDirectory(): WorkingDirectory;
    /**
     * Get the absolute path to the commands cache file.
     * @returns {string} The commands cache path.
     */
    GetCachePath(): string;
}

/**
 * The bot's flavor text.
 */
export interface ConstantsText {
    /**
     * Get a random "thinking" message.
     * @returns {string} A random message.
     */
    Think(): string;
    /**
     * Get a random "secret/restricted" message.
     * @returns {string} A random message.
     */
    Secret(): string;
}

/**
 * The bot's presence activities.
 */
export interface ConstantsPresence {
    /**
     * An array of activities to be used in the presence.
     * @param {ActivityOptions} [options] The options for the activity.
     * @returns {GatewayActivityUpdateData[]} An array of activities.
     */
    Activities(options?: ActivityOptions): GatewayActivityUpdateData[];
}

/**
 * The bot's music-domain state helpers.
 */
export interface ConstantsMusic {
    /**
     * Get the autoplay state label of the player.
     * @param {boolean} state Whether autoplay is enabled or not.
     * @returns {AutoplayState} The autoplay state label.
     */
    AutoplayState(state: boolean): AutoplayState;
    /**
     * Get the paused state label of the player.
     * @param {boolean} state Whether the player is paused or not.
     * @returns {PausedState} The paused state label.
     */
    PauseState(state: boolean): PausedState;
    /**
     * Get the next loop mode of the player.
     * @param {LoopMode} mode The current loop mode of the player.
     * @param {boolean} [alt] Whether to keep the current mode (alternative behaviour).
     * @returns {LoopMode} The resolved loop mode.
     */
    LoopMode(mode: LoopMode, alt?: boolean): LoopMode;
}

/**
 * The bot's Redis connection helpers.
 */
export interface ConstantsRedis {
    /**
     * Build the Redis URL from the environment variables.
     * @returns {string} The Redis URL.
     */
    GetUrl(): string;
    /**
     * Get the namespace for the Redis keys.
     * @returns {string} The namespace for the Redis keys.
     */
    GetNamespace(): string;
}
