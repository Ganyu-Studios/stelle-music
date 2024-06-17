import type { NodeOption } from "shoukaku";

interface StelleSpotify {
    /**
     * Spotify search market.
     * @default "US"
     */
    searchMarket: "US" | "IN" | "EN";
    /**
     * Spotify tracks per page.
     * @default 1
     */
    playlistPageLimit: number;
    /**
     * Spotify tracks per page.
     * @default 1
     */
    albumPageLimit: number;
    /**
     * Spotify track limit for searching tracks.
     * @default 10
     */
    searchLimit: number;
    /** Spotify application client id. */
    clientId: string;
    /** Spotify application client secret. */
    clientSecret: string;
}

interface StelleColors {
    /** The success color. */
    success: number;
    /** The success color. */
    extra: number;
}

export interface StelleConfiguration {
    /**
     * Stelle default prefix.
     * @default "stelle"
     */
    defaultPrefix: string;
    /**
     * Stelle default player volume.
     * @default 60
     */
    defaultVolume: number;
    /**
     * Stelle default player search engine.
     * @default "spotify"
     */
    defaultSearchEngine: "spotify" | "youtube" | "youtube_music";
    /**
     * Stelle prefixes.
     * @default ["st!"]
     */
    prefixes: string[];
    /**
     * Stelle default locale.
     * @default "en-US"
     */
    defaultLocale: string;
    /**
     * Stelle disconnect time.
     * @default ms("30s")
     */
    disconnectTime: number;
    /** Stelle developer id(s). */
    developerIds: string[];
    /** Stelle developer guild id(s). */
    guildIds: string[];
    /** Stelle nodes. */
    nodes: NodeOption[];
    /** Stelle spotify data. */
    spotify: StelleSpotify;
    /** Stelle colors. */
    color: StelleColors;
}
