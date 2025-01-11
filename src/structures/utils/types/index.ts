import type { ContextMenuCommand, ClientUser, SubCommand, Command } from "seyfert";
import type { PermissionFlagsBits } from "seyfert/lib/types/index.js";
import type { PlayerJson } from "lavalink-client";

export type { LavalinkEventType, LavalinkEventRun, LavalinkEvent, AllEvents } from "./client/StelleLavalink.js";
export type { StelleConfiguration, StelleEnvironment } from "./client/StelleConfiguration.js";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "disabled" | "enabled";
export type PausedMode = "resume" | "pause";
export type NonCommandOptions = Omit<Options, "category">;
export type NonGlobalCommands = ContextMenuCommand | SubCommand | Command;

export type StellePlayerJson = Omit<
    PlayerJson,
    "lastPositionChange" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "playing" | "paused" | "ping"
> & {
    enabledAutoplay?: boolean;
    localeString?: string;
    messageId?: string;
            me?: ClientUser;
};
export interface Options {
    /**
     *
     * The command category.
     * @default StelleCategory.Unknown
     */
    category?: StelleCategory;
    /**
     *
     * Only the guild owner cam use the command.
     * @default false
     */
    onlyGuildOwner?: boolean;
    /**
     *
     * Only the bot developer can use the command.
     * And sent the command to developer(s) guild(s).
     * @default false
     */
    onlyDeveloper?: boolean;
    /**
     *
     * The cooldown.
     * @default 3
     */
    cooldown?: number;
}

export enum StelleKeys {
    Player = "guild:player",
    Locale = "guild:locale",
    Prefix = "guild:prefix"
}

export enum StelleCategory {
    Unknown = 0,
    User = 1,
    Guild = 2,
    Music = 3
}
