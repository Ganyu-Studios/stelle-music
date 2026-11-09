import type { UsingClient } from "seyfert";
import type {
    BoundCacheAdapterFactory,
    CacheAdapter,
    CacheAdapterFactory,
    CacheAdapterOptions,
} from "#stelle/classes/modules/adapters/CacheAdapter.js";
import { MemoryCacheAdapter } from "#stelle/classes/modules/adapters/MemoryCacheAdapter.js";
import { RedisCacheAdapter } from "#stelle/classes/modules/adapters/RedisCacheAdapter.js";

/**
 * The built-in cache backends, selectable by name in the config's `cache.adapter`.
 * @type {Record<"memory" | "redis", CacheAdapterFactory>}
 */
export const BuiltinCacheAdapters = {
    memory: <T>(options: CacheAdapterOptions): CacheAdapter<T> => new MemoryCacheAdapter<T>(options),
    redis: <T>(options: CacheAdapterOptions, client: UsingClient): CacheAdapter<T> => new RedisCacheAdapter<T>(client.redis, options),
} satisfies Record<"memory" | "redis", CacheAdapterFactory>;

/**
 * Resolve the configured cache backend: a built-in one by name, or the custom factory set as `cache.adapter`.
 * @param {UsingClient} client Stelle's client, including the Redis connection.
 * @returns {BoundCacheAdapterFactory} The configured adapter factory, bound to the client.
 */
export function createCacheAdapterFactory(client: UsingClient): BoundCacheAdapterFactory {
    const { adapter } = client.config.cache;
    const factory: CacheAdapterFactory = typeof adapter === "function" ? adapter : BuiltinCacheAdapters[adapter];

    return <T>(options: CacheAdapterOptions): CacheAdapter<T> => factory<T>(options, client);
}
