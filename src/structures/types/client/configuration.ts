import type { NodeOptions, SearchSources } from "hoshimi";
import type { PermissionStrings } from "seyfert";
import type { Locale, LocaleString } from "seyfert/lib/types/index.js";

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
    voicePermissions: PermissionStrings;
    /**
     * The stage channel permissions.
     * @default ["MuteMembers"]
     */
    stagePermissions: PermissionStrings;
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

/**
 * The rendered-image (banner) disk cache configuration.
 */
interface Images {
    /**
     * Whether to cache rendered now-playing banners on disk.
     * @type {boolean}
     * @default true
     */
    enabled: boolean;
    /**
     * How long a cached banner stays valid, refreshed on each hit. (In milliseconds)
     * @type {number}
     * @default ms("24h")
     */
    ttl: number;
    /**
     * The maximum number of cached banners kept on disk (least-recently-used are evicted first).
     * @type {number}
     * @default 100
     */
    maxEntries: number;
}

/**
 * The music quiz configuration.
 */
interface Quiz {
    /**
     * The pool the quiz draws its random tracks from: each entry is either a URL (playlist or track) or a
     * plain search query. All entries are resolved, flattened, de-duplicated and shuffled once per game.
     * @type {string[]}
     */
    source: string[];
    /**
     * How many tracks (rounds) a single game runs for.
     * @type {number}
     * @default 10
     */
    rounds: number;
    /**
     * How long each track plays before the round advances. (In milliseconds)
     * @type {number}
     * @default ms("30s")
     */
    snippet: number;
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

interface Playlists {
    /**
     * The maximum amount of playlists each user can create.
     * @type {number}
     * @default 25
     */
    userLimit: number;
    /**
     * The maximum amount of tracks in a playlist.
     * @type {number}
     * @default 100
     */
    trackLimit: number;
}

/**
 * The configuration interface.
 */
export interface InternalStelleConfiguration {
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
     * The rendered-image (banner) disk cache configuration.
     * @type {Images}
     */
    images: Images;
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
    /**
     * The playlists configuration.
     * @type {Playlists}
     */
    playlists: Playlists;
    /**
     * The music quiz configuration.
     * @type {Quiz}
     */
    quiz: Quiz;
}

/**
 * The loadable configuration interface.
 */
export interface StelleConfiguration extends InternalStelleConfiguration {
    /**
     * Loads the configuration.
     * @returns {Promise<void>} A promise that resolves when the configuration is loaded.
     */
    load(): Promise<void>;
    /**
     * Reloads the configuration.
     * @returns {Promise<void>} A promise that resolves when the configuration is reloaded.
     */
    reload(): Promise<void>;
}
