import type { PlayerJson } from "lavalink-client";
import type { ClientUser, Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { PermissionFlagsBits } from "seyfert/lib/types/index.js";

export type { StelleConfiguration } from "./client/StelleConfiguration.js";
export type { AllEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType } from "./client/StelleLavalink.js";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type NonCommandOptions = Omit<Options, "category">;
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;

export type StellePlayerJson = Omit<
    PlayerJson,
    "ping" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "lastPositionChange" | "paused" | "playing"
> & {
    messageId?: string;
    enabledAutoplay?: boolean;
    me?: ClientUser;
    localeString?: string;
};
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
     * Only a member in a voice channel can use the command.
     * @default false
     */
    inVoice?: boolean;
    /**
     *
     * Only a member on the same voice channel with Stelle will be able to use the command.
     * @default false
     */
    sameVoice?: boolean;
    /**
     *
     * Check if Stelle is connected atleast in one node.
     * @default false
     */
    checkNodes?: boolean;
    /**
     *
     * Check if a player exists in a guild.
     * @default false
     */
    checkPlayer?: boolean;
    /**
     *
     * Check if the player queue has more than one track.
     * @default false
     */
    checkQueue?: boolean;
    /**
     *
     * Check if the queue has two or more tracks.
     * @default false
     */
    moreTracks?: boolean;
    /**
     *
     * The command category.
     * @default StelleCategory.Unknown
     */
    category?: StelleCategory;
}

export enum StelleKeys {
    Player = "guild:player",
    Locale = "guild:locale",
    Prefix = "guild:prefix",
}

export enum StelleCategory {
    Unknown = 0,
    User = 1,
    Guild = 2,
    Music = 3,
}
