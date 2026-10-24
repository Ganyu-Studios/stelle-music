import type { RedisClientType } from "@redis/client";
import type { CacheAdapter, CacheAdapterOptions } from "#stelle/classes/modules/adapters/CacheAdapter.js";

/**
 * A Redis-backed cache adapter.
 * @template T The collection value type.
 * @class RedisCacheAdapter
 * @implements {CacheAdapter<T>}
 */
export class RedisCacheAdapter<T> implements CacheAdapter<T> {
    /**
     * Redis client used by this adapter.
     * @type {RedisClientType}
     * @readonly
     */
    readonly redis: RedisClientType;

    /**
     * Cache key namespace.
     * @type {string}
     * @readonly
     */
    readonly namespace: string;

    /**
     * Entry TTL in seconds.
     * @type {number}
     * @readonly
     */
    readonly ttl: number;

    /**
     * Create a Redis cache adapter.
     * @param {RedisClientType} redis The Redis client.
     * @param {CacheAdapterOptions} options Adapter options.
     */
    constructor(redis: RedisClientType, options: CacheAdapterOptions) {
        this.redis = redis;
        this.namespace = `stellecache:${options.namespace}`;
        this.ttl = Math.max(1, Math.ceil(options.expire / 1000));
    }

    private key(key: string): string {
        return `${this.namespace}:${key}`;
    }

    public async get(key: string): Promise<T | undefined> {
        const value: string | null = await this.redis.get(this.key(key));
        return value === null ? undefined : (JSON.parse(value) as T);
    }

    public async set(key: string, value: T): Promise<this> {
        await this.redis.set(this.key(key), JSON.stringify(value), { EX: this.ttl });
        return this;
    }

    public async delete(key: string): Promise<boolean> {
        return (await this.redis.del(this.key(key))) > 0;
    }

    public async has(key: string): Promise<boolean> {
        return (await this.redis.exists(this.key(key))) > 0;
    }

    public async clear(): Promise<void> {
        for await (const keys of this.redis.scanIterator({ MATCH: `${this.namespace}:*`, COUNT: 100 })) {
            if (keys.length) await this.redis.del(keys);
        }
    }
}
