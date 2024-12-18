import type { guildLocale, guildPlayer, guildPrefix } from "@prisma/client";
import { LimitedCollection } from "seyfert";
import { Configuration } from "#stelle/data/Configuration.js";
import { StelleKeys } from "#stelle/types";

interface Cache {
    [StelleKeys.Locale]: guildLocale;
    [StelleKeys.Player]: guildPlayer;
    [StelleKeys.Prefix]: guildPrefix;
}

/**
 * Main Stelle cache class.
 */
export class StelleCache {
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
     * @returns
     */
    public get<T extends StelleKeys = StelleKeys>(guildId: string, key: T): Cache[T] | undefined {
        return this.internal.get(guildId)?.get(key) as Cache[T] | undefined;
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
     * Set the data to the cache.
     * @param guildId The guild id.
     * @param key The key.
     * @param data The data.
     * @returns
     */
    public set<T extends StelleKeys = StelleKeys>(guildId: string, key: T, data: Cache[T]): void {
        if (this.internal.has(guildId) && !this.internal.get(guildId)?.has(key)) return this.internal.get(guildId)?.set(key, data);

        const collection = new LimitedCollection<StelleKeys, unknown>();
        collection.set(key, data);
        return this.internal.set(guildId, collection);
    }
}
