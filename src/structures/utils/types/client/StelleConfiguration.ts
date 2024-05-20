import type { NodeOption } from "shoukaku";

interface StelleSpotify {
    /** Spotify application client id. */
    clientId: string;
    /** Spotify application client secret. */
    clientSecret: string;
    /** Spotify search market. */
    searchMarket: "US" | "IN" | "EN";
    /** Spotify tracks per page. */
    playlistPageLimit: number;
    /** Spotify tracks per page. */
    albumPageLimit: number;
    /** Spotofy track limit for searching tracks. */
    searchLimit: number;
}
export interface StelleConfiguration {
    /** Stelle default prefix. */
    defaultPrefix: string;
    /** Stelle prefixes. */
    prefixes: string[];
    /** Stelle developer id(s). */
    developerIds: string[];
    /** Stelle developer guild id(s). */
    guildIds: string[];
    /** Stelle default locale. */
    defaultLocale: string;
    /** Stelle nodes. */
    nodes: NodeOption[];
    /** Stelle spotify data. */
    spotify: StelleSpotify;
}
