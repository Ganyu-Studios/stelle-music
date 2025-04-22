import { LimitedCollection } from "seyfert";
import type { guildLocale, guildPlayer, guildPrefix, guildRequest } from "#stelle/prisma";
import { CacheKeys, type Omit, type Prettify } from "#stelle/types";
import { Configuration } from "#stelle/utils/data/configuration.js";

/**
 * The interface of the database cache keys.
 */
interface CacheMap {
    [CacheKeys.Locale]: Prettify<Omit<guildLocale, "id">>;
    [CacheKeys.Player]: Prettify<Omit<guildPlayer, "id">>;
    [CacheKeys.Prefix]: Prettify<Omit<guildPrefix, "id">>;
    [CacheKeys.Request]: Prettify<Omit<guildRequest, "id">>;
}

/**
 * Class representing the cache of the bot.
 * @class Cache
 */
export class Cache {
    /**
     *
     * The internal cache.
     * @type {LimitedCollection<string, LimitedCollection<CacheKeys, unknown>>}
     * @readonly
     */
    readonly internal: LimitedCollection<string, LimitedCollection<CacheKeys, unknown>> = new LimitedCollection({
        limit: Configuration.cacheSize,
    });

    /**
     *
     * Get the data from the cache.
     * @param {T} key The key.
     * @param {string} id The guild id.
     * @returns {CacheMap[T] | undefined} The cached data.
     */
    public get<T extends CacheKeys = CacheKeys>(key: T, id: string): CacheMap[T] | undefined {
        return this.internal.get(id)?.get(key) as CacheMap[T] | undefined;
    }

    /**
     *
     * Delete the data in the cache.
     * @param {string} id The guild id.
     * @returns {boolean} If the data was deleted.
     */
    public delete(id: string): boolean {
        return this.internal.delete(id);
    }

    /**
     *
     * Delete the data key in the cache.
     * @param {string} id The guild id.
     * @param {T} key The key.
     * @returns {boolean} If the data key was deleted.
     */
    public deleteKey<T extends CacheKeys = CacheKeys>(key: T, id: string): boolean {
        return this.internal.get(id)?.delete(key) ?? false;
    }

    /**
     *
     * Set the data to the cache.
     * @param {string} id The guild id.
     * @param {T} key The key.
     * @param {CacheMap[T]} data The data.
     * @returns {void} Nothing... just sets the data to the cache.
     */
    public set<T extends CacheKeys = CacheKeys>(key: T, id: string, data: CacheMap[T]): void {
        if (this.internal.has(id) && !this.internal.get(id)?.has(key)) {
            this.internal.get(id)?.set(key, data);
            return;
        }

        const collection = new LimitedCollection<CacheKeys, unknown>();
        collection.set(key, data);

        this.internal.set(id, collection);

        return;
    }
}
