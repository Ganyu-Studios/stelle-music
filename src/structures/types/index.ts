import type { PlayerJson } from "lavalink-client";
import type { ClientUser, Command, ContextMenuCommand, SubCommand, User } from "seyfert";
import type { EmojiResolvable } from "seyfert/lib/common/index.js";
import type { APIUser, ButtonStyle, PermissionFlagsBits } from "seyfert/lib/types/index.js";

export type { StelleConfiguration, StelleEnvironment } from "./client/configuration.js";
export type { StelleConstants, WorkingDirectory, AutoplayState, PausedState } from "./client/constants.js";

export {
    type LavalinkEvents,
    type LavalinkEvent,
    type LavalinkEventRun,
    type LavalinkEventType,
    LavalinkEventTypes,
} from "./client/lavalink.js";

/**
 * The type of non-unique button styles like link and premium.
 */
export type NonUniqueButtonStyles = Exclude<ButtonStyle, ButtonStyle.Link | ButtonStyle.Premium>;

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
 * The enum of the database cache keys.
 */
export enum StelleKeys {
    /**
     * The guild player key.
     */
    Player = "guild:player",
    /**
     * The guild locale key.
     */
    Locale = "guild:locale",
    /**
     * The guild prefix key.
     */
    Prefix = "guild:prefix",
    /**
     * The text channel request key.
     */
    //Request = "guild:request",
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
 * The interface for the edit buttons options.
 */
export interface EditButtonOptions {
    /**
     * The custom id of the button.
     * @type {string}
     */
    customId: string;
    /**
     * The style of the button.
     * @type {NonUniqueButtonStyles}
     */
    style?: NonUniqueButtonStyles;
    /**
     * The label of the button.
     * @type {string}
     */
    label?: string;
    /**
     * The emoji of the button.
     * @type {EmojiResolvable}
     */
    emoji?: EmojiResolvable;
}

/**
 * The type of the api user.
 */
export type StelleUser = APIUser & {
    tag: string;
};

/**
 * The type of the player session.
 */
export type StellePlayerJson = Omit<
    PlayerJson,
    "ping" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "lastPositionChange" | "paused" | "playing" | "queue" | "filters"
>;

/**
 * The type of the session.
 */
export type SessionJson = StellePlayerJson & {
    /**
     * The message id of the track start message.
     */
    messageId?: string;
    /**
     * Whatever the autoplay is enabled or not.
     */
    enabledAutoplay?: boolean;
    /**
     * The client user object.
     */
    me?: CustomUser<ClientUser>;
    /**
     * The locale string of the guild.
     */
    localeString?: string;
    /**
     * The lyrics message id.
     */
    lyricsId?: string;
    /**
     * Whatever the lyrics is enabled or not.
     */
    lyricsEnabled?: boolean;
};

/**
 * The type to prettify the object.
 */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

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

/**
 * The type of the user without the client.
 */
export type CustomUser<T extends User = User> = Omit<T, "client">;
