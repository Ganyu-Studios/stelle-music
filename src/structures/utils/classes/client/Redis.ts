import { Redis } from "ioredis";
import type { UsingClient } from "seyfert";
import { Environment } from "#stelle/data/Configuration.js";

export class RedisClient {
    /**
     * The Redis instance.
     */
    readonly redis: Redis = new Redis({
        host: Environment.RedisHost,
        port: Environment.RedisPort,
        password: Environment.RedisPassword,
        username: "default",
        db: 0,
        tls: {
            rejectUnauthorized: false,
        },
    });

    /**
     * The client instance.
     */
    readonly client: UsingClient;

    /**
     *
     * Create a new Redis client.
     * @param client The client instance.
     */
    constructor(client: UsingClient) {
        this.client = client;
        this.redis.once("connect", () => this.client.logger.info("Redis - Stelle is now connected to Redis."));
        this.redis.on("error", (error) => this.client.logger.error(`Redis - An error occurred: ${error}`));
    }

    /**
     *
     * Get the value of a key.
     * @param key The key to get.
     */
    public get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    /**
     *
     * Set a key with a value.
     * @param key The key to set.
     * @param value The value to set.
     */
    public async set(key: string, value: string): Promise<void> {
        await this.redis.set(key, value);
        return;
    }

    /**
     *
     * Delete a key.
     * @param key The key to delete.
     */
    public del(key: string): Promise<number> {
        return this.redis.del(key);
    }

    /**
     *
     * Check if a key exists.
     * @param key The key to check.
     */
    public exists(key: string): Promise<number> {
        return this.redis.exists(key);
    }

    /**
     *
     * Set a key to expire after a certain amount of time.
     * @param key The key to set.
     * @param time The time to expire.
     */
    public expire(key: string, time: number): Promise<number> {
        return this.redis.expire(key, time);
    }
}
