import type { RedisClientType } from "@redis/client";
import { type QueueJSON, QueueStorageAdapter } from "hoshimi";
import { StelleRedis } from "#stelle/utils/data/constants.js";

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
        await this.redis.set(this.buildKey(this.namespace, key), this.stringify(value));
    }

    override async delete(key: string): Promise<boolean> {
        const result: number = await this.redis.del(this.buildKey(this.namespace, key));
        return result > 0;
    }

    override async clear(): Promise<void> {
        await this.redis.flushAll();
    }

    override async has(key: string): Promise<boolean> {
        const result: number = await this.redis.exists(this.buildKey(this.namespace, key));
        return result > 0;
    }

    override parse(value: unknown): QueueJSON {
        if ((typeof value === "string" && !value.length) || (typeof value === "object" && value && !Object.keys(value).length))
            return {} as QueueJSON;
        return typeof value === "string" ? JSON.parse(value) : (value as QueueJSON);
    }

    override stringify<R = string>(value: unknown): R {
        return (typeof value === "object" ? JSON.stringify(value) : value) as R;
    }
}
