import { deserialize, serialize } from "node:v8";
import type { RedisClient } from "bun";
import type { CacheAdapter, CacheAdapterOptions } from "#stelle/classes/modules/adapters/CacheAdapter.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * A Redis-backed cache adapter.
 *
 * Values are encoded with `node:v8`'s serializer (the same algorithm as `structuredClone`) instead of JSON, so records
 * come back exactly as the in-memory adapter returns them: a `Date` stays a `Date` rather than turning into an ISO
 * string. The bytes are stored base64-encoded to keep using the shared string client. Bun writes JavaScriptCore's wire
 * format, so an entry left by the old Node.js build doesn't decode and is read as a miss.
 * @template T The collection value type.
 * @class RedisCacheAdapter
 * @implements {CacheAdapter<T>}
 */
export class RedisCacheAdapter<T> implements CacheAdapter<T> {
    /**
     * Redis client used by this adapter.
     * @type {RedisClient}
     * @readonly
     */
    readonly redis: RedisClient;

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
     * @param {RedisClient} redis The Redis client.
     * @param {CacheAdapterOptions} options Adapter options.
     */
    constructor(redis: RedisClient, options: CacheAdapterOptions) {
        this.redis = redis;
        this.namespace = `stellecache:${options.namespace}`;
        this.ttl = Math.max(1, Math.ceil(options.expire / 1000));
    }

    private key(key: string): string {
        return `${this.namespace}:${key}`;
    }

    public async get(key: string): Promise<T | undefined> {
        const value: string | null = await this.redis.get(this.key(key));
        if (value === null) return undefined;

        // An entry that can't be decoded (e.g. one written by the older JSON encoding) is treated as a miss, so the
        // caller re-reads the database and overwrites it. Not `null`: that is a valid cached value (a negative cache).
        return UtilsOps.try(
            (): T => deserialize(Buffer.from(value, "base64")) as T,
            (): undefined => undefined,
        );
    }

    public async set(key: string, value: T): Promise<this> {
        await this.redis.set(this.key(key), serialize(value).toString("base64"), "EX", this.ttl);
        return this;
    }

    public async delete(key: string): Promise<boolean> {
        return (await this.redis.del(this.key(key))) > 0;
    }

    public async has(key: string): Promise<boolean> {
        return this.redis.exists(this.key(key));
    }

    public async clear(): Promise<void> {
        let cursor: string = "0";

        do {
            const [next, keys] = await this.redis.scan(cursor, "MATCH", `${this.namespace}:*`, "COUNT", 100);
            if (keys.length) await this.redis.del(...keys);
            cursor = next;
        } while (cursor !== "0");
    }
}
