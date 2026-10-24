import type { Awaitable, CacheAdapter, CacheAdapterFactory, CacheAdapterOptions } from "#stelle/classes/modules/CacheAdapter.js";
import { MemoryCacheAdapter } from "#stelle/classes/modules/MemoryCacheAdapter.js";
import type { guildLocale, guildPlayer, guildPrefix, guildRequestChannel, userPlaylist } from "#stelle/prisma";
import { Configuration } from "#stelle/utils/data/configuration.js";

/**
 * Everything cached for a single guild. The primary cache key is the guild id, so all of a guild's configuration lives
 * together in one bucket and is evicted together.
 * @class GuildBucket
 */
export class GuildBucket {
    // The config scalars are tri-state: `undefined` means "not read from the database yet" (a cache miss), while `null`
    // means "read and known absent" (a negative cache) so a guild on default config doesn't re-hit MongoDB on every op.

    /**
     * The guild locale config. `null` when read and absent (negative cache).
     * @type {guildLocale | null | undefined}
     */
    locale?: guildLocale | null;
    /**
     * The guild prefix config. `null` when read and absent (negative cache).
     * @type {guildPrefix | null | undefined}
     */
    prefix?: guildPrefix | null;
    /**
     * The guild player config (default volume, search platform). `null` when read and absent (negative cache).
     * @type {guildPlayer | null | undefined}
     */
    player?: guildPlayer | null;
    /**
     * The guild request-channel config (channel + panel message). `null` when read and absent (negative cache).
     * @type {guildRequestChannel | null | undefined}
     */
    requests?: guildRequestChannel | null;
}

/**
 * Build the shared options for a cache collection: bounded by `size` with a sliding TTL (`resetOnDemand`) so that
 * frequently-accessed entries stay cached and only idle ones are evicted.
 * @returns {{ limit: number; expire: number; resetOnDemand: true }} The collection options.
 */
function cacheOptions(namespace: string): CacheAdapterOptions {
    return { limit: Configuration.cache.limit, expire: Configuration.cache.expire, namespace };
}

/**
 * Class representing the cache of the bot. The primary tree is keyed by guild id ({@link GuildBucket}); the playlist
 * collection is kept apart because playlists aren't guild-scoped (a playlist is owned by a user and addressed by its
 * own id).
 * @class Cache
 */
export class Cache {
    /**
     * The per-guild buckets, keyed by guild id. This is the primary cache tree; its `limit` is the number of guilds.
     * @type {CacheAdapter<GuildBucket>}
     * @readonly
     */
    readonly guilds: CacheAdapter<GuildBucket>;

    /**
     * The user playlists, keyed by playlist id. Global (a playlist belongs to a user, not a guild). A cached `null` is
     * a negative cache (read and known absent), distinct from a missing key (not read yet).
     * @type {CacheAdapter<userPlaylist | null>}
     * @readonly
     */
    readonly playlists: CacheAdapter<userPlaylist | null>;

    /**
     * Create a Stelle cache.
     *
     * The optional factory is the extension point for alternative backends. Both collections receive independent
     * adapters so a backend can keep their namespaces separate.
     * @param {CacheAdapterFactory} [createAdapter] Adapter factory. Memory is the default.
     */
    constructor(createAdapter: CacheAdapterFactory = <T>(options: CacheAdapterOptions) => new MemoryCacheAdapter<T>(options)) {
        this.guilds = createAdapter<GuildBucket>(cacheOptions("guilds"));
        this.playlists = createAdapter<userPlaylist | null>(cacheOptions("playlists"));
    }

    /**
     * Get the guild's bucket, creating (and caching) an empty one if it doesn't exist yet. Use this on writes.
     * @param {string} guildId The guild id.
     * @returns {Promise<GuildBucket>} The guild's bucket.
     */
    public async guild(guildId: string): Promise<GuildBucket> {
        let bucket: GuildBucket | undefined = await this.guilds.get(guildId);
        if (!bucket) {
            bucket = new GuildBucket();
            await this.guilds.set(guildId, bucket);
        }

        return bucket;
    }

    /**
     * Get the guild's bucket without creating one. Use this on reads so a cache miss doesn't leave empty buckets
     * behind (and, via `resetOnDemand`, a hit keeps the bucket warm).
     * @param {string} guildId The guild id.
     * @returns {Awaitable<GuildBucket | undefined>} The guild's bucket, or undefined if it isn't cached.
     */
    public getGuild(guildId: string): Awaitable<GuildBucket | undefined> {
        return this.guilds.get(guildId);
    }
}
