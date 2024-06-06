import type { PermissionFlagsBits } from "discord-api-types/v10";
import type {
    CommandContext,
    ComponentContext,
    MenuCommandContext,
    MessageCommandInteraction,
    ModalContext,
    UserCommandInteraction,
} from "seyfert";
import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP } from "seyfert/lib/client/base.js";

export { StelleConfiguration } from "./client/StelleConfiguration.js";
export { KazagumoEvents, ShoukakuEvents, AllEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType } from "./client/StelleLavalink.js";

export type StelleRuntime = { locations: { lavalink: string } };
//literally just copied this because the types cry
export type InternalStelleRuntime<
    T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig,
> = { debug: boolean } & Omit<T, "locations" | "debug"> & {
        templates: string | undefined;
        langs: string | undefined;
        events: string | undefined;
        components: string | undefined;
        commands: string | undefined;
        base: string;
        output: string;
        lavalink: string;
    };

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type LoopMode = "none" | "queue" | "track";
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type InternalRuntime = InternalRuntimeConfigHTTP | InternalRuntimeConfig;
export type AnyContext =
    | CommandContext
    | MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>
    | ComponentContext
    | ModalContext;

export interface Options {
    /** The command cooldown. */
    cooldown?: number;
    /** Only the bot developer can use the command. */
    onlyDeveloper?: boolean;
    /** Only the guild owner cam use the command. */
    onlyGuildOwner?: boolean;
    /** Only a member in a voice channel can use the command. */
    inVoice?: boolean;
    /** Only a member on the same voice channel with Stelle will be able to use the command. */
    sameVoice?: boolean;
    /** Check if Stelle is connected atleast in one node. */
    checkNodes?: boolean;
    /** Check if a player exists in a guild. */
    checkPlayer?: boolean;
    /** Check if the player queue has more than one track. */
    checkQueue?: boolean;
    /** Check if the queue has two or more tracks. */
    moreTracks?: boolean;
}
