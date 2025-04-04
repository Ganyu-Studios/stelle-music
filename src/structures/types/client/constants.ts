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
 * The working directory of the bot.
 */
export type StelleDirectory = "src" | "dist";

/**
 * The constants interface.
 */
export interface StelleConstants {
    /**
     * The current version of Stelle.
     * @type {string}
     */
    Version: string;
    /**
     * Check if Stelle is running in development mode. (Only if the flag is provided.)
     * @type {boolean}
     * @default false
     */
    Dev: boolean;
    /**
     * Check if Stelle is running in production mode. (Only if the flag is provided.)
     * @type {boolean}
     * @default false
     */
    Debug: boolean;
    /**
     * An array of activities to be used in the presence.
     * @param {ActivityOptions} options - The options for the activity.
     * @type {GatewayActivityUpdateData[]}
     * @returns {GatewayActivityUpdateData[]} An array of activities.
     * @description This is used to get the activities for the presence.
     */
    Activities(options?: ActivityOptions): GatewayActivityUpdateData[];
    /**
     * Get a random message from the list of messages.
     * @returns {string} A random message.
     * @description This is used to get a random message from the list of messages.
     */
    ThinkMessage(): string;
    /**
     * Get a random message from the list of messages.
     * @returns {string} A random message.
     * @description This is used to get a random message from the list of messages.
     */
    SecretMessage(): string;
    /**
     * Get the current working directory of the bot.
     * @returns {StelleDirectory} The current working directory of the bot.
     * @description This is used to get the current working directory of the bot.
     */
    WorkingDirectory(): StelleDirectory;
}
