import type { QueueStoreManager, StoredQueue } from "lavalink-client";
import type { RedisClient } from "./Redis.js";

/**
 *
 * Build a key for the queue.
 * @param guildId The guild id.
 * @returns
 */
const buildKey = (guildId: string) => `stellequeue:${guildId}`;

export class RedisQueueStore implements QueueStoreManager {
    /**
     * The Redis instance.
     */
    readonly redis: RedisClient;

    /**
     *
     * Create a new Redis queue store.
     * @param redis The Redis instance.
     */
    constructor(redis: RedisClient) {
        this.redis = redis;
    }

    /**
     *
     * Get the queue of the guild.
     * @param guildId The guild id to get the queue.
     * @returns
     */
    public get(guildId: string): Promise<StoredQueue | string> {
        return this.redis.get(buildKey(guildId)) as Promise<StoredQueue | string>;
    }

    /**
     *
     * Set the queue of the guild.
     * @param guildId The guild id to set the queue.
     * @param value The value to set.
     * @returns
     */
    public set(guildId: string, value: StoredQueue | string): Promise<void | boolean> {
        return this.redis.set(buildKey(guildId), value as string);
    }

    /**
     *
     * Delete the queue of the guild.
     * @param guildId The guild id to delete the queue.
     * @returns
     */
    public delete(guildId: string): Promise<void | boolean> {
        return this.redis
            .del(buildKey(guildId))
            .then(() => true)
            .catch(() => false);
    }

    /**
     *
     * Stringify the value.
     * @param value The value to stringify.
     * @returns
     */
    public stringify(value: StoredQueue | string): Promise<StoredQueue | string> {
        return (typeof value === "object" ? JSON.stringify(value) : value) as never as Promise<StoredQueue | string>;
    }

    /**
     *
     * Parse the value.
     * @param value The value to parse.
     * @returns
     */
    public parse(value: StoredQueue | string): Promise<Partial<StoredQueue>> {
        return typeof value === "string" ? JSON.parse(value) : value;
    }
}
