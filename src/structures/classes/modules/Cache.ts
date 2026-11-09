import type { CacheAdapter, CacheAdapterFactory, CacheAdapterOptions } from "#stelle/classes/modules/adapters/CacheAdapter.js";
import { MemoryCacheAdapter } from "#stelle/classes/modules/adapters/MemoryCacheAdapter.js";
import type { guildLocale, guildPlayer, guildPrefix, guildRequestChannel, userPlaylist } from "#stelle/prisma";
import { Configuration } from "#stelle/utils/data/configuration.js";

/**
 * Build the shared options for a cache collection: bounded by `limit` entries, expiring after `expire` milliseconds.
 * @param {string} namespace The collection namespace, which keeps each collection's keys apart in a shared backend.
 * @returns {CacheAdapterOptions} The collection options.
 */
function cacheOptions(namespace: string): CacheAdapterOptions {
    return { limit: Configuration.cache.limit, expire: Configuration.cache.expire, namespace };
}

/**
 * Class representing the cache of the bot: one collection per record type.
 *
 * Every collection stores whole records under its own key and is only ever written through `set`, never by mutating
 * a value read from it. Backends that serialize (Redis) hand back a fresh copy on each `get`, so an in-place mutation
 * would silently never reach the store.
 *
 * In every collection a cached `null` is a negative cache (read and known absent), so a guild on default config
 * doesn't re-hit MongoDB on every op; a missing key (`undefined`) means not read yet.
 * @class Cache
 */
export class Cache {
    /**
     * The guild locale configs, keyed by guild id.
     * @type {CacheAdapter<guildLocale | null>}
     * @readonly
     */
    readonly locales: CacheAdapter<guildLocale | null>;

    /**
     * The guild prefix configs, keyed by guild id.
     * @type {CacheAdapter<guildPrefix | null>}
     * @readonly
     */
    readonly prefixes: CacheAdapter<guildPrefix | null>;

    /**
     * The guild player configs (default volume, search platform), keyed by guild id.
     * @type {CacheAdapter<guildPlayer | null>}
     * @readonly
     */
    readonly players: CacheAdapter<guildPlayer | null>;

    /**
     * The guild request-channel configs (channel + panel message), keyed by guild id.
     * @type {CacheAdapter<guildRequestChannel | null>}
     * @readonly
     */
    readonly requests: CacheAdapter<guildRequestChannel | null>;

    /**
     * The user playlists, keyed by playlist id. Global (a playlist belongs to a user, not a guild).
     * @type {CacheAdapter<userPlaylist | null>}
     * @readonly
     */
    readonly playlists: CacheAdapter<userPlaylist | null>;

    /**
     * Create a Stelle cache.
     *
     * The optional factory is the extension point for alternative backends. Every collection receives an independent
     * adapter so a backend can keep their namespaces separate.
     * @param {CacheAdapterFactory} [createAdapter] Adapter factory. Memory is the default.
     */
    constructor(createAdapter: CacheAdapterFactory = <T>(options: CacheAdapterOptions) => new MemoryCacheAdapter<T>(options)) {
        this.locales = createAdapter<guildLocale | null>(cacheOptions("locales"));
        this.prefixes = createAdapter<guildPrefix | null>(cacheOptions("prefixes"));
        this.players = createAdapter<guildPlayer | null>(cacheOptions("players"));
        this.requests = createAdapter<guildRequestChannel | null>(cacheOptions("requests"));
        this.playlists = createAdapter<userPlaylist | null>(cacheOptions("playlists"));
    }
}
