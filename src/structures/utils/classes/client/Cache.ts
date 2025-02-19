import type { guildLocale, guildPlayer, guildPrefix } from "@prisma/client";
import { LimitedCollection } from "seyfert";
import { Configuration } from "#stelle/data/Configuration.js";
import { StelleKeys } from "#stelle/types";

interface CacheKeys {
    [StelleKeys.Locale]: guildLocale;
    [StelleKeys.Player]: guildPlayer;
    [StelleKeys.Prefix]: guildPrefix;
}

/**
 * Main Stelle cache class.
 */
export class Cache {
    /**
     *
     * The internal cache.
     * @readonly
     */
    readonly internal: LimitedCollection<string, LimitedCollection<StelleKeys, unknown>> = new LimitedCollection({
        limit: Configuration.cache.size,
    });

    /**
     *
     * Get the data from the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @returns {CacheKeys[T] | undefined} The cached data.
     */
    public get<T extends StelleKeys = StelleKeys>(guildId: string, key: T): CacheKeys[T] | undefined {
        return this.internal.get(guildId)?.get(key) as CacheKeys[T] | undefined;
    }

    /**
     *
     * Delete the data in the cache.
     * @param guildId The guild id.
     * @returns {boolean} If the data was deleted.
     */
    public delete(guildId: string): boolean {
        return this.internal.delete(guildId);
    }

    /**
     *
     * Delete the data in the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @returns {boolean} If the data key was deleted.
     */
    public deleteKey<T extends StelleKeys = StelleKeys>(guildId: string, key: T): boolean {
        return this.internal.get(guildId)?.delete(key) ?? false;
    }

    /**
     *
     * Set the data to the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @param data The data.
     * @returns {void} Nothing... just sets the data to the cache.
     */
    public set<T extends StelleKeys = StelleKeys>(guildId: string, key: T, data: CacheKeys[T]): void {
        if (this.internal.has(guildId) && !this.internal.get(guildId)?.has(key)) return this.internal.get(guildId)?.set(key, data);

        const collection = new LimitedCollection<StelleKeys, unknown>();
        collection.set(key, data);
        return this.internal.set(guildId, collection);
    }
}
