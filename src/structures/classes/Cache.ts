import { LimitedCollection } from "seyfert";
import type { guildLocale, guildPlayer, guildPrefix } from "#stelle/prisma";
import { type Omit, type Prettify, StelleKeys } from "#stelle/types";
import { Configuration } from "#stelle/utils/data/configuration.js";

/**
 * The interface of the database cache keys.
 */
interface CacheKeys {
    [StelleKeys.Locale]: Prettify<Omit<guildLocale, "id">>;
    [StelleKeys.Player]: Prettify<Omit<guildPlayer, "id">>;
    [StelleKeys.Prefix]: Prettify<Omit<guildPrefix, "id">>;
}

/**
 * Class representing the cache of the bot.
 * @class Cache
 */
export class Cache {
    /**
     *
     * The internal cache.
     * @type {LimitedCollection<string, LimitedCollection<StelleKeys, unknown>>}
     * @readonly
     */
    readonly internal: LimitedCollection<string, LimitedCollection<StelleKeys, unknown>> = new LimitedCollection({
        limit: Configuration.cacheSize,
    });

    /**
     *
     * Get the data from the cache.
     * @param {T} key The key.
     * @param {string} id The guild id.
     * @returns {CacheKeys[T] | undefined} The cached data.
     */
    public get<T extends StelleKeys = StelleKeys>(key: T, id: string): CacheKeys[T] | undefined {
        return this.internal.get(id)?.get(key) as CacheKeys[T] | undefined;
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
    public deleteKey<T extends StelleKeys = StelleKeys>(key: T, id: string): boolean {
        return this.internal.get(id)?.delete(key) ?? false;
    }

    /**
     *
     * Set the data to the cache.
     * @param {string} id The guild id.
     * @param {T} key The key.
     * @param {CacheKeys[T]} data The data.
     * @returns {void} Nothing... just sets the data to the cache.
     */
    public set<T extends StelleKeys = StelleKeys>(key: T, id: string, data: CacheKeys[T]): void {
        if (this.internal.has(id) && !this.internal.get(id)?.has(key)) {
            this.internal.get(id)?.set(key, data);
            return;
        }

        const collection = new LimitedCollection<StelleKeys, unknown>();
        collection.set(key, data);

        this.internal.set(id, collection);

        return;
    }
}
