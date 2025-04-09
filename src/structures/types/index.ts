import type { PlayerJson } from "lavalink-client";
import type { Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { PermissionFlagsBits } from "seyfert/lib/types/index.js";

export type { StelleConfiguration, StelleEnvironment } from "./client/configuration.js";
export type { StelleConstants, StelleDirectory } from "./client/constants.js";

export {
    type LavalinkEvents,
    type LavalinkEvent,
    type LavalinkEventRun,
    type LavalinkEventType,
    LavalinkEventTypes,
} from "./client/lavalink.js";

/**
 * The enum of the command category.
 */
export enum StelleCategory {
    /**
     * The unknown category.
     * @type {number}
     */
    Unknown = 0,
    /**
     * The user category.
     * @type {number}
     */
    User = 1,
    /**
     * The guild category.
     * @type {number}
     */
    Guild = 2,
    /**
     * The music category.
     * @type {number}
     */
    Music = 3,
}

/**
 * The type of the command options.
 */
export interface Options {
    /**
     *
     * The cooldown.
     * @default 3
     */
    cooldown?: number;
    /**
     *
     * Only the bot developer can use the command.
     * And sent the command to developer(s) guild(s).
     * @default false
     */
    onlyDeveloper?: boolean;
    /**
     *
     * Only the guild owner cam use the command.
     * @default false
     */
    onlyGuildOwner?: boolean;
    /**
     *
     * The command category.
     * @default StelleCategory.Unknown
     */
    category?: StelleCategory;
}

/**
 * The type of the player session.
 */
export type StellePlayerJson = Omit<
    PlayerJson,
    "ping" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "lastPositionChange" | "paused" | "playing" | "queue" | "filters"
>;

/**
 * The type of the paused states.
 */
export type PausedMode = "pause" | "resume";

/**
 * The type of the permission flags.
 */
export type PermissionNames = keyof typeof PermissionFlagsBits;

/**
 * Construct a type with the properties of T except for those in type K.
 */
// Since the original one doesn't return the types that you want to exclude. So I added it
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * The options for non-command commands.
 */
export type NonCommandOptions = Omit<Options, "category">;

/**
 * The types for non-global commands.
 */
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;
