import type { LavalinkNodeOptions, SearchPlatform } from "lavalink-client";
import type { PermissionStrings } from "seyfert";

interface StelleColors {
    /** The success color. */
    success: number;
    /** The success color. */
    extra: number;
}

interface StelleChannels {
    /** Stelle added or removed guilds log channel id. */
    guildsId: string;
    /** Stelle errors log channel id. */
    errorsId: string;
}

interface StelleCache {
    /**
     * Stelle commands cache filename.
     * @default "commands.json"
     */
    filename: string;
    /**
     * Stelle cache max size.
     * @default 5
     */
    size: number;
}

interface StelleSessions {
    /**
     * Enable the sessions feature.
     * @default true
     */
    enabled: boolean;
    /**
     * Stelle node(s) resume time.
     * @default ms("1min")
     */
    resumeTime: number;
    /**
     * Force the players to resume.
     * @default true
     */
    resumePlayers: boolean;
}

interface StellePermissions {
    /**
     * Stelle voice channel permissions.
     * @default ["ViewChannel", "Connect", "Speak"]
     */
    voicePermissions: PermissionStrings;
    /**
     * Stelle stage channel permissions.
     * @default ["MuteMembers"]
     */
    stagePermissions: PermissionStrings;
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
    /** Stelle developer id(s). */
    developerIds: string[];
    /** Stelle developer guild id(s). */
    guildIds: string[];
    /** Stelle nodes. */
    nodes: LavalinkNodeOptions[];
    /** Stelle colors. */
    color: StelleColors;
    /** Stelle channels. */
    channels: StelleChannels;
    /** Stelle cache.*/
    cache: StelleCache;
    /** Stelle sessions. */
    sessions: StelleSessions;
    /** Stelle permissions. */
    permissions: StellePermissions;
}

export interface StelleEnvironment {
    /** Stelle token. */
    Token?: string;
    /** Stelle database url. */
    DatabaseUrl?: string;
    /** Stelle errors webhook. */
    ErrorsWebhook?: string;
    /** The Stelle redis host */
    RedisHost?: string;
    /** The Stelle redis port */
    RedisPort?: number;
    /** The Stelle redis password */
    RedisPassword?: string;
}
