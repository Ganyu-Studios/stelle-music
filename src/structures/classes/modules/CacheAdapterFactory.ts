import type { UsingClient } from "seyfert";
import type { CacheAdapterFactory, CacheAdapterOptions } from "#stelle/classes/modules/CacheAdapter.js";
import { MemoryCacheAdapter } from "#stelle/classes/modules/MemoryCacheAdapter.js";
import { RedisCacheAdapter } from "#stelle/classes/modules/RedisCacheAdapter.js";

/**
 * Resolve the configured cache backend.
 * @param {UsingClient} client Stelle's client, including the Redis connection.
 * @returns {CacheAdapterFactory} The configured adapter factory.
 */
export function createCacheAdapterFactory(client: UsingClient): CacheAdapterFactory {
    if (client.config.cache.adapter === "redis") {
        return <T>(options: CacheAdapterOptions) => new RedisCacheAdapter<T>(client.redis, options);
    }

    return <T>(options: CacheAdapterOptions) => new MemoryCacheAdapter<T>(options);
}
