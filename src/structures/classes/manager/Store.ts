import type { RedisClientType } from "@redis/client";
import { type QueueJSON, QueueStorageAdapter } from "hoshimi";
import { StelleRedis } from "#stelle/utils/data/constants.js";

/**
 * TTL (seconds) refreshed on every queue write so an orphaned key can't leak forever if its player is torn down
 * without a clean delete (crash / ungraceful shutdown). `set` fires on every queue mutation, so a live queue keeps
 * resetting it; the window only needs to outlast the longest realistic gap between writes (a single long track).
 * @type {number}
 */
const QUEUE_TTL_SECONDS: number = 7 * 24 * 60 * 60;

/**
 * Class representing the Redis queue store.
 * @class RedisQueueStore
 * @implements {QueueStoreManager}
 */
export class RedisQueueStore extends QueueStorageAdapter {
    override namespace: string = StelleRedis.GetNamespace();

    /**
     * The redis client instance.
     * @type {RedisClient}
     * @readonly
     */
    readonly redis: RedisClientType;

    /**
     *
     * Create a new Redis queue store.
     * @param {RedisClient} redis The Redis instance.
     */
    constructor(redis: RedisClientType) {
        super();
        this.redis = redis;
    }

    override async get(key: string): Promise<QueueJSON | undefined> {
        const data: string | null = await this.redis.get(this.buildKey(this.namespace, key));
        if (!data) return undefined;

        return this.parse(data);
    }
    override async set(key: string, value: QueueJSON): Promise<void> {
        await this.redis.set(this.buildKey(this.namespace, key), this.stringify(value), { EX: QUEUE_TTL_SECONDS });
    }

    override async delete(key: string): Promise<boolean> {
        const result: number = await this.redis.del(this.buildKey(this.namespace, key));
        return result > 0;
    }

    override async clear(): Promise<void> {
        // Scoped to this store's namespace instead of `flushAll()`: the queues share the database with
        // whatever else lives in it, and dev (`internal`) shares it with prod (`stellequeue`), so
        // flushing everything would take far more than the queues this adapter owns.
        for await (const keys of this.redis.scanIterator({ MATCH: `${this.namespace}:*`, COUNT: 100 })) {
            if (keys.length) await this.redis.del(keys);
        }
    }

    override async has(key: string): Promise<boolean> {
        const result: number = await this.redis.exists(this.buildKey(this.namespace, key));
        return result > 0;
    }

    override parse(value: unknown): QueueJSON {
        if ((typeof value === "string" && !value.length) || (typeof value === "object" && value && !Object.keys(value).length))
            return {} as QueueJSON;
        if (typeof value === "string") return JSON.parse(value);
        return value as QueueJSON;
    }

    override stringify<R = string>(value: unknown): R {
        if (typeof value === "object") return JSON.stringify(value) as R;
        return value as R;
    }
}
