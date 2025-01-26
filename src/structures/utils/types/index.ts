import type { PlayerJson } from "lavalink-client";
import type { ClientUser, Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { ButtonComponent, LinkButtonComponent, SKUButtonComponent } from "seyfert/lib/components/ButtonComponent.js";
import type { ButtonStyle, PermissionFlagsBits } from "seyfert/lib/types/index.js";

export { LavalinkEventTypes } from "./client/StelleLavalink.js";

export type { StelleConfiguration, StelleEnvironment } from "./client/StelleConfiguration.js";
export type { AllLavalinkEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType } from "./client/StelleLavalink.js";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type NonCommandOptions = Omit<Options, "category">;
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;
export type ButtonStyleWithoutLink = Exclude<ButtonStyle, ButtonStyle.Link | ButtonStyle.Premium>;
export type ButtonComponents = ButtonComponent | LinkButtonComponent | SKUButtonComponent;

export type EditRowsOptions = {
    customId: string;
    style?: ButtonStyleWithoutLink;
    label?: string;
};

export type StellePlayerJson = Omit<
    PlayerJson,
    "ping" | "createdTimeStamp" | "lavalinkVolume" | "equalizer" | "lastPositionChange" | "paused" | "playing" | "queue" | "filters"
> & {
    messageId?: string;
    enabledAutoplay?: boolean;
    me?: ClientUser;
    localeString?: string;
    lyricsId?: string;
    lyricsEnabled?: boolean;
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
