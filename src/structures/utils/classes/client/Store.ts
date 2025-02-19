import type { QueueStoreManager, StoredQueue } from "lavalink-client";
import { DEV_MODE } from "#stelle/data/Constants.js";
import type { RedisClient } from "./Redis.js";

/**
 *
 * Build a key for the queue.
 * @param guildId The guild id.
 * @returns {string} The built key.
 */
const buildKey = (guildId: string) => (DEV_MODE ? `queue:${guildId}` : `stelle:queue:${guildId}`);

/**
 * Main Stelle redis queue store class.
 */
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
     * @returns {Promise<StoredQueue | string>} The queue.
     */
    public get(guildId: string): Promise<StoredQueue | string> {
        return this.redis.get<StoredQueue | string>(buildKey(guildId)) as Promise<StoredQueue | string>;
    }

    /**
     *
     * Set the queue of the guild.
     * @param guildId The guild id to set the queue.
     * @param value The value to set.
     * @returns {Promise<void | boolean>} A promise.
     */
    public set(guildId: string, value: StoredQueue | string): Promise<void | boolean> {
        return this.redis.set(buildKey(guildId), value as string);
    }

    /**
     *
     * Delete the queue of the guild.
     * @param guildId The guild id to delete the queue.
     * @returns {Promise<boolean>} If the queue was deleted.
     */
    public delete(guildId: string): Promise<boolean> {
        return this.redis
            .del(buildKey(guildId))
            .then(() => true)
            .catch(() => false);
    }

    /**
     *
     * Stringify the value.
     * @param value The value to stringify.
     * @returns {Promise<StoredQueue | string>} The stringified value.
     */
    public stringify(value: StoredQueue | string): Promise<StoredQueue | string> {
        return (typeof value === "object" ? JSON.stringify(value) : value) as never as Promise<StoredQueue | string>;
    }

    /**
     *
     * Parse the value.
     * @param value The value to parse.
     * @returns {Promise<Partial<StoredQueue>>} The parsed value.
     */
    public parse(value: StoredQueue | string): Promise<Partial<StoredQueue>> {
        return typeof value === "string" ? JSON.parse(value) : value;
    }
}
