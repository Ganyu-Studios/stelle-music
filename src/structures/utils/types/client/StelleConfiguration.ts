import type { LavalinkNodeOptions, SearchPlatform } from "lavalink-client";

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
    defaultSearchEngine: SearchPlatform;
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
    /**
     * Stelle cache max size.
     * @default 25
     */
    maxCache: number;
    /** Stelle developer id(s). */
    developerIds: string[];
    /** Stelle developer guild id(s). */
    guildIds: string[];
    /** Stelle nodes. */
    nodes: LavalinkNodeOptions[];
    /** Stelle colors. */
    color: StelleColors;
}
