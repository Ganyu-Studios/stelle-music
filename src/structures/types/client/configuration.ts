import type { NodeOptions, SearchSources } from "hoshimi";
import type { PermissionStrings } from "seyfert";
import type { Locale, LocaleString, PermissionFlagsBits } from "seyfert/lib/types/index.js";

type PermissionFlagsBit = (typeof PermissionFlagsBits)[keyof typeof PermissionFlagsBits];

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
     * The voice channel permissions.
     * @default ["ViewChannel", "Connect", "Speak"]
     */
    voicePermissions: PermissionStrings | PermissionFlagsBit[];
    /**
     * The stage channel permissions.
     * @default ["MuteMembers"]
     */
    stagePermissions: PermissionStrings | PermissionFlagsBit[];
}

/**
 * The sessions configuration interface.
 */
interface Sessions {
    /**
     * Enable the node resume session.
     * @type {boolean}
     * @default true
     */
    enabled: boolean;
    /**
     * The node session resume time. (In seconds)
     * @type {number}
     * @default 60
     */
    resumeTime: number;
    /**
     * Force the players to resume.
     * @type {boolean}
     * @default true
     */
    resumePlayers: boolean;
}

/**
 * The cache interface.
 */
interface Cache {
    /**
     * The maximum size of the cache.
     * @type {number}
     * @default 5
     */
    size: number;
    /**
     * The cache expiration time in milliseconds.
     * @type {number}
     * @default ms("5mins")
     */
    expire: number;
}

interface Deleter {
    /**
     * Whether to delete the message when the track ends.
     * @type {boolean}
     * @default false
     */
    onTrackEnd: boolean;
    /**
     * Whether to delete the message when the track is skipped.
     * @type {boolean}
     * @default false
     */
    onTrackSkip: boolean;
    /**
     * Whether to delete the message when the player is stopped.
     * @type {boolean}
     * @default false
     */
    onPlayerStop: boolean;
}

interface TwentyFourSeven {
    /**
     * Whether the bot should stay 24/7 in the voice channel.
     * @type {boolean}
     * @default false
     */
    is247: boolean;
    /**
     * Whether to auto-pause the player when twentyforseven is enabled.
     * @type {boolean}
     * @default true
     */
    autoPause: boolean;
}

/**
 * The configuration interface.
 */
export interface StelleConfiguration {
    /**
     * The default locale.
     * @default "en-US"
     * @type {LocaleString}
     */
    defaultLocale: LocaleString | Locale;
    /**
     * The default prefix used to use text commands.
     * @type {string}
     * @default "stelle"
     */
    defaultPrefix: string;
    /**
     * The default presence update interval in milliseconds.
     * @type {number}
     * @default ms("25s")
     */
    presenceInterval: number;
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
     * @type {NodeOptions[]}
     */
    nodes: NodeOptions[];
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
     * The default lyrics lines to show.
     * @type {number}
     * @default 10
     */
    lyricsLines: number;
    /**
     * The default player volume.
     * @type {number}
     * @default 60
     */
    defaultVolume: number;
    /**
     * The default player search engine.
     * @type {SearchSources}
     * @default "spotify"
     */
    defaultSearchSource: SearchSources;
    /**
     * The disconnect time in milliseconds. (Use the time formatter)
     * @type {number}
     * @default ms("30s")
     */
    disconnectTime: number;
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
    /**
     * The sessions configuration.
     * @type {Sessions}
     */
    sessions: Sessions;
    /**
     * The cache configuration.
     * @type {Cache}
     */
    cache: Cache;
    /**
     * The deleter message configuration.
     * @type {Deleter}
     */
    deleter: Deleter;
    /**
     * Whether the bot should stay 24/7 in the voice channel.
     * @type {boolean}
     * @default false
     */
    twentyfourseven: TwentyFourSeven;
}

/**
 * The loadable configuration interface.
 */
export interface LoadableStelleConfiguration extends StelleConfiguration {
    /**
     * Loads the configuration.
     * @returns {Promise<void>} A promise that resolves when the configuration is loaded.
     */
    load(): Promise<void>;
}
