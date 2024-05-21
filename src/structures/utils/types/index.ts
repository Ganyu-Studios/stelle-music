import type { InternalRuntimeConfig, InternalRuntimeConfigHTTP } from "seyfert/lib/client/base.js";

export { StelleConfiguration } from "./client/StelleConfiguration.js";
export { KazagumoEvents, ShoukakuEvents, AllEvents, LavalinkEvent, LavalinkEventRun, LavalinkEventType } from "./client/StelleLavalink.js";

export type StelleRuntime = { locations: { lavalink: string } };
export type InternalStelleRuntime<T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig> = { debug: boolean; } & Omit<T, "locations" | "debug"> & { templates: string | undefined; langs: string | undefined; events: string | undefined; components: string | undefined; commands: string | undefined; base: string; output: string; lavalink: string } 
export type InternalRuntime = InternalRuntimeConfigHTTP | InternalRuntimeConfig;

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
}
