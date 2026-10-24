import { LimitedCollection } from "seyfert";
import type { CacheAdapter } from "#stelle/classes/modules/CacheAdapter.js";

/**
 * Options for the in-memory cache adapter.
 */
export interface MemoryCacheOptions {
    /**
     * Maximum number of entries.
     * @type {number}
     */
    limit: number;
    /**
     * Sliding expiration time in milliseconds.
     * @type {number}
     */
    expire: number;
}

/**
 * The default cache adapter. It keeps values in a bounded, expiring in-memory collection.
 * @template T The collection value type.
 * @class MemoryCacheAdapter
 * @implements {CacheAdapter<T>}
 */
export class MemoryCacheAdapter<T> implements CacheAdapter<T> {
    /**
     * The underlying Seyfert collection.
     * @type {LimitedCollection<string, T>}
     * @readonly
     */
    readonly collection: LimitedCollection<string, T>;

    /**
     * Create an in-memory cache adapter.
     * @param {MemoryCacheOptions} options The collection limits.
     */
    constructor(options: MemoryCacheOptions) {
        this.collection = new LimitedCollection({
            limit: options.limit,
            expire: options.expire,
            resetOnDemand: true,
        });
    }

    public get(key: string): T | undefined {
        return this.collection.get(key);
    }

    public set(key: string, value: T): this {
        this.collection.set(key, value);
        return this;
    }

    public delete(key: string): boolean {
        return this.collection.delete(key);
    }

    public has(key: string): boolean {
        return this.collection.has(key);
    }

    public clear(): void {
        this.collection.clear();
    }
}
