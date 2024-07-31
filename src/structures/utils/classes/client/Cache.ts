import { Configuration } from "#stelle/data/Configuration.js";
import { StelleKeys } from "#stelle/types";
import type { guildLocale, guildPlayer, guildPrefix } from "@prisma/client";
import { LimitedCollection } from "seyfert";


interface Cache {
    [StelleKeys.Locale]: guildLocale;
    [StelleKeys.Player]: guildPlayer;
    [StelleKeys.Prefix]: guildPrefix;
}

/**
 * Main Stelle cache class.
 */
export class StelleCache {
    readonly cache: LimitedCollection<string, LimitedCollection<StelleKeys, unknown>> = new LimitedCollection({ limit: Configuration.maxCache });

    /**
     * 
     * Get the data from the cache.
     * @param guildId 
     * @param key 
     * @returns 
     */
    public get<T extends StelleKeys = StelleKeys>(guildId: string, key: T): Cache[T] | undefined {
        return this.cache.get(guildId)?.get(key) as Cache[T] | undefined;
    }

    /**
     * 
     * Delete the data in the cache.
     * @param guildId 
     * @returns 
     */
    public delete(guildId: string): boolean {
        return this.cache.delete(guildId);
    }

    /**
     * 
     * Set the data to the cache.
     * @param guildId 
     * @param key 
     * @param data 
     * @returns 
     */
    public set<T extends StelleKeys = StelleKeys>(guildId: string, key: T, data: Cache[T]): void {
        if (this.cache.has(guildId) && !this.cache.get(guildId)?.has(key)) return this.cache.get(guildId)?.set(key, data);

        const collection = new LimitedCollection<StelleKeys, unknown>();
        collection.set(key, data);
        return this.cache.set(guildId, collection);
    }
}