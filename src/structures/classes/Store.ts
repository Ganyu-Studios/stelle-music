import type { QueueStoreManager, StoredQueue } from "lavalink-client";
import { Constants } from "#stelle/utils/data/constants.js";
import { InvalidQueue } from "#stelle/utils/errors.js";
import type { RedisClient } from "./modules/Redis.js";

/**
 * The stored queue partial type.
 */
type PartialStoredQueue = Partial<StoredQueue>;

/**
 *
 * Build a key for the queue.
 * @param {string} guildId The guild id.
 * @returns {string} The built key.
 */
const buildKey = (guildId: string): string => (Constants.Dev ? `queue:${guildId}` : `stelle:queue:${guildId}`);

/**
 * Class representing the Redis queue store.
 * @class RedisQueueStore
 * @implements {QueueStoreManager}
 */
export class RedisQueueStore implements QueueStoreManager {
    /**
     * The redis client instance.
     * @type {RedisClient}
     * @readonly
     */
    readonly redis: RedisClient;

    /**
     *
     * Create a new Redis queue store.
     * @param {RedisClient} redis The Redis instance.
     */
    constructor(redis: RedisClient) {
        this.redis = redis;
    }

    /**
     *
     * Get the queue of the guild.
     * @param {string} id The guild id to get the queue.
     * @returns {Promise<StoredQueue | string>} The queue.
     */
    public async get(id: string): Promise<StoredQueue | string> {
        const data = await this.redis.get<StoredQueue | string>(buildKey(id));
        if (!data) throw new InvalidQueue(`No queue found for guild ${id}`);

        return data;
    }

    /**
     *
     * Set the queue of the guild.
     * @param {string} id The guild id to set the queue.
     * @param {StoredQueue | string} value The value to set.
     * @returns {Promise<void>} A promise.
     */
    public set(id: string, value: StoredQueue | string): Promise<void> {
        return this.redis.set(buildKey(id), value as string);
    }

    /**
     *
     * Delete the queue of the guild.
     * @param {string} id The guild id to delete the queue.
     * @returns {Promise<void>} If the queue was deleted.
     */
    public delete(id: string): Promise<void> {
        return this.redis.del(buildKey(id));
    }

    /**
     *
     * Stringify the value.
     * @param {StoredQueue | string} value The value to stringify.
     * @returns {Promise<StoredQueue | string>} The stringified value.
     */
    public stringify(value: StoredQueue | string): Promise<StoredQueue | string> {
        return Promise.resolve<StoredQueue | string>(typeof value === "object" ? JSON.stringify(value) : value);
    }

    /**
     *
     * Parse the value.
     * @param {StoredQueue | string} value The value to parse.
     * @returns {Promise<PartialStoredQueue>} The parsed value.
     */
    public parse(value: StoredQueue | string): Promise<PartialStoredQueue> {
        return Promise.resolve<PartialStoredQueue>(typeof value === "string" ? JSON.parse(value) : value);
    }
}
