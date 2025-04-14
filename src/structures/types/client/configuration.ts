import type { LavalinkNodeOptions, SearchPlatform } from "lavalink-client";
import type { PermissionStrings } from "seyfert";
import type { LocaleString } from "seyfert/lib/types/index.js";

/**
 * The colors configuration interface.
 */
interface Colors {
    /**
     * The primary color of the bot.
     * @default 0x8d86a8
     * @type {number}
     */
    success: number;
    /**
     * The secondary color of the bot.
     * @default 0xece8f1
     * @type {number}
     */
    extra: number;
}

/**
 * The channels configuration interface.
 */
interface Channels {
    /**
     * The channel id where the bot will send the guilds log.
     * @type {string}
     */
    guildsId: string;
    /**
     * The channel id where the bot will send the errors log.
     * @type {string}
     */
    errorsId: string;
}

/**
 * The permissions configuration interface.
 */
interface Permissions {
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

/**
 * The configuration interface.
 */
export interface StelleConfiguration {
    /**
     * Stelle default locale.
     * @default "en-US"
     * @type {LocaleString}
     */
    defaultLocale: LocaleString;
    /**
     * The default prefix used to use text commands.
     * @type {string}
     * @default "stelle"
     */
    defaultPrefix: string;
    /**
     * The prefixes used to use text commands.
     * @type {string[]}
     * @default ["st!"]
     */
    prefixes: string[];
    /**
     * The guild ids to push commands to.
     * @type {string[]}
     */
    guildIds: string[];
    /**
     * The developer ids.
     * @type {string[]}
     */
    developerIds: string[];
    /**
     * The lavalink nodes list.
     * @type {LavalinkNodeOptions[]}
     */
    nodes: LavalinkNodeOptions[];
    /**
     * The bot invite link.
     * @type {string}
     */
    inviteLink: string;
    /**
     * The bot repository link.
     * @type {string}
     */
    githubLink: string;
    /**
     * The commands cache file name.
     * @type {string}
     * @default "commands.json"
     */
    fileName: `${string}.json`;
    /**
     * The max cache size.
     * @type {number}
     * @default 5
     */
    cacheSize: number;
    /**
     * Stelle default player volume.
     * @default 60
     */
    defaultVolume: number;
    /**
     * Stelle default player search engine.
     * @default "spotify"
     */
    defaultSearchPlatform: SearchPlatform;
    /**
     * The colors configuration.
     * @type {Colors}
     */
    color: Colors;
    /**
     * The channels configuration.
     * @type {Channels}
     */
    channels: Channels;
    /**
     * The permissions configuration.
     * @type {Permissions}
     */
    permissions: Permissions;
}

/**
 * The environment variables interface.
 */
export interface StelleEnvironment {
    /**
     * The bot token.
     * @type {string}
     */
    Token?: string;
    /**
     * The database URL.
     * @type {string}
     */
    DatabaseUrl?: string;
    /**
     * The errors webhook URL.
     * @type {string}
     */
    ErrorsWebhook?: string;
    /**
     * The Redis host.
     * @type {string}
     */
    RedisHost?: string;
    /**
     * The Redis port.
     * @type {number}
     */
    RedisPort?: number;
    /**
     * The Redis password.
     * @type {string}
     */
    RedisPassword?: string;
}
