import { deflateRawSync, inflateRawSync } from "node:zlib";
import { Redis } from "ioredis";
import type { UsingClient } from "seyfert";
import { Environment } from "#stelle/data/Configuration.js";

/**
 * Main Stelle Redis client class.
 */
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
     *
     * Create a new Redis client.
     * @param client The client instance.
     */
    constructor(client: UsingClient) {
        this.redis.once("connect", () => client.logger.info("Redis - Stelle is now connected to Redis."));
        this.redis.on("error", (error) => client.logger.error(`Redis - An error occurred: ${error}`));
    }

    /**
     *
     * Get the value of a key.
     * @param key The key to get.
     */
    public async get<T>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);
        if (!value) return null;

        return JSON.parse(inflateRawSync(Buffer.from(value, "base64")).toString());
    }

    /**
     *
     * Set a key with a value.
     * @param key The key to set.
     * @param value The value to set.
     */
    public async set<T>(key: string, value: T): Promise<void> {
        const json = JSON.stringify(value);
        const buffer = deflateRawSync(Buffer.from(json)).toString("base64");

        await this.redis.set(key, buffer);

        return;
    }

    /**
     *
     * Delete a key.
     * @param key The key to delete.
     */
    public async del(key: string): Promise<void> {
        await this.redis.del(key);
        return;
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
