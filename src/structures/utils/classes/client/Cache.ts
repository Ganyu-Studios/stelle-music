import type { guildLocale, guildPlayer, guildPrefix } from "@prisma/client";
import type { StelleKeys } from "#stelle/types";

import { Configuration } from "#stelle/data/Configuration.js";
import { LimitedCollection } from "seyfert";

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
    readonly internal = new LimitedCollection<string, LimitedCollection<StelleKeys, unknown>>({
        limit: Configuration.cache.size
    });

    /**
     *
     * Set the data to the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @param data The data.
     * @returns
     */
    public set<T extends StelleKeys = StelleKeys>(guildId: string, key: T, data: CacheKeys[T]): void {
        if (this.internal.has(guildId) && !this.internal.get(guildId)?.has(key)) {
            return this.internal.get(guildId)?.set(key, data);
        }

        const collection = new LimitedCollection<StelleKeys, unknown>();
        collection.set(key, data);
        this.internal.set(guildId, collection);
    }

    /**
     *
     * Get the data from the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @returns
     */
    public get<T extends StelleKeys = StelleKeys>(guildId: string, key: T): CacheKeys[T] | undefined {
        return this.internal.get(guildId)?.get(key) as CacheKeys[T] | undefined;
    }

    /**
     *
     * Delete the data in the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @returns
     */
    public deleteKey<T extends StelleKeys = StelleKeys>(guildId: string, key: T): boolean {
        return this.internal.get(guildId)?.delete(key) ?? false;
    }

    /**
     *
     * Delete the data in the cache.
     * @param guildId The guild id.
     * @returns
     */
    public delete(guildId: string): boolean {
        return this.internal.delete(guildId);
    }
}
