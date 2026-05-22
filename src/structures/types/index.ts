import type { NodeJSON, PlayerJSON } from "hoshimi";
import type { Command, ContextMenuCommand, SubCommand, User } from "seyfert";
import type { EmojiResolvable } from "seyfert/lib/common/index.js";
import type { ButtonStyle, PermissionFlagsBits } from "seyfert/lib/types/index.js";

export * from "./client/components.js";
export type { InternalStelleConfiguration, StelleConfiguration } from "./client/configuration.js";
export type { AutoplayState, PausedState, StelleConstants, WorkingDirectory } from "./client/constants.js";
export type { ImageData } from "./client/image.js";
export type {
    LavalinkEvent,
    LavalinkEventRun,
} from "./client/lavalink.js";
export type * from "./client/locales.js";

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
export enum CacheKeys {
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
     * The user playlist key.
     */
    Playlist = "user:playlist",
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
    /**
     * Skip registering the command.
     * @default false
     */
    skipRegister?: boolean;
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
    style: NonUniqueButtonStyles;
    /**
     * The label of the button.
     * @type {string}
     */
    label: string;
    /**
     * The emoji of the button.
     * @type {EmojiResolvable}
     */
    emoji: EmojiResolvable;
    /**
     * Whatever the button is disabled or not.
     * @type {boolean}
     */
    disabled: boolean;
}

/**
 * The type of the api user.
 */
export type TrackUser = Omit<
    Plain<User>,
    | "client"
    | "avatarDecorationData"
    | "banner"
    | "createdAt"
    | "discriminator"
    | "flags"
    | "publicFlags"
    | "accentColor"
    | "system"
    | "verified"
    | "email"
    | "mfaEnabled"
    | "primaryGuild"
    | "premiumType"
    | "locale"
    | "name"
    | "createdTimestamp"
    | "globalName"
    | "avatar"
    | "bot"
>;

/**
 * The type of the player session.
 */
export interface StellePlayerJson
    extends Omit<PlayerJSON, "ping" | "createdTimestamp" | "lastPositionUpdate" | "paused" | "playing" | "queue" | "filters" | "node"> {
    node: NonOptionsNode;
}

/**
 * The type of the node without options, since the options are not serializable and not needed in the session.
 */
export type NonOptionsNode = Omit<NodeJSON, "options">;

/**
 * The type of the session.
 */
export interface SessionJson extends StellePlayerJson {
    /**
     * The message id of the track start message.
     * @type {string | undefined}
     */
    messageId?: string;
    /**
     * Whatever the autoplay is enabled or not.
     * @type {boolean | undefined}
     */
    enabledAutoplay?: boolean;
    /**
     * The client user object.
     * @type {TrackUser | undefined}
     */
    me?: TrackUser;
    /**
     * The locale string of the guild.
     * @type {string | undefined}
     */
    localeString?: string;
    /**
     * The lyrics message id.
     * @type {string | undefined}
     */
    lyricsId?: string;
    /**
     * Whatever the lyrics is enabled or not.
     * @type {boolean | undefined}
     */
    lyricsEnabled?: boolean;
    /**
     * Whatever the 24/7 mode is enabled or not.
     * @type {boolean | undefined}
     */
    is247?: boolean;
    /**
     * Whatever the auto-pause in 24/7 mode is enabled or not.
     * @type {boolean | undefined}
     */
    isAutoPause?: boolean;
}

/**
 * The metadata for the webhook.
 */
export interface WebhookMetadata {
    /**
     * The id of the webhook.
     * @type {string}
     */
    id: string;
    /**
     * The token of the webhook.
     * @type {string}
     */
    token: string;
}

/**
 * The type to get the plain object without functions.
 */
export type Plain<T> = {
    // biome-ignore lint/complexity/noBannedTypes: Just want to exclude functions
    [K in keyof T as T[K] extends Function ? never : K]: T[K];
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
