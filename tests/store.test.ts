import assert from "node:assert/strict";
import { test } from "node:test";
import type { RedisClientType } from "@redis/client";

// Same reason as in `cache.test.ts`: importing anything under `#stelle` pulls in `configuration.ts`, which parses
// `process.env` at import time. Dummy values are enough; no connection is ever opened.
process.env.TOKEN ||= "test-token";
process.env.DATABASE_URL ||= "mongodb://127.0.0.1:27017/stelle-test";
process.env.ERRORS_WEBHOOK ||= "https://example.com/webhook";
process.env.REDIS_HOST ||= "127.0.0.1";
process.env.REDIS_PORT ||= "6379";
process.env.REDIS_PASSWORD ||= "test";

const { RedisQueueStore } = await import("#stelle/classes/Store.js");

/**
 * Stands in for the pieces of `@redis/client` the store touches. `scanIterator` mirrors the v6 contract: it yields
 * *batches* of keys, honours `MATCH` glob patterns, and pages through the keyspace rather than returning it at once.
 */
function createFakeRedis(seed: Record<string, string>, pageSize: number = 2) {
    const store = new Map<string, string>(Object.entries(seed));
    const calls: string[] = [];

    const fake = {
        keys: (): string[] => [...store.keys()],
        calls,
        async get(key: string): Promise<string | null> {
            return store.get(key) ?? null;
        },
        async set(key: string, value: string): Promise<void> {
            store.set(key, value);
        },
        async del(keys: string | string[]): Promise<number> {
            const list: string[] = Array.isArray(keys) ? keys : [keys];

            calls.push(`del:${list.length}`);

            return list.filter((key): boolean => store.delete(key)).length;
        },
        async exists(key: string): Promise<number> {
            return store.has(key) ? 1 : 0;
        },
        async flushAll(): Promise<void> {
            throw new Error("flushAll must not be reachable: it would wipe keys this store does not own.");
        },
        async *scanIterator(options: { MATCH: string; COUNT: number }): AsyncGenerator<string[]> {
            const pattern = new RegExp(
                `^${options.MATCH.split("*")
                    .map((part): string => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                    .join(".*")}$`,
            );
            const matched: string[] = [...store.keys()].filter((key): boolean => pattern.test(key));

            for (let index = 0; index < matched.length; index += pageSize) {
                yield matched.slice(index, index + pageSize);
            }
        },
    };

    return fake;
}

test("clear only removes keys in the store's namespace", async () => {
    const fake = createFakeRedis({
        "stellequeue:111": "{}",
        "stellequeue:222": "{}",
        "stellequeue:333": "{}",
        "internal:444": "{}",
        "session:555": "{}",
        unrelated: "{}",
    });

    const store = new RedisQueueStore(fake as unknown as RedisClientType);
    store.namespace = "stellequeue";

    await store.clear();

    assert.deepEqual(fake.keys().sort(), ["internal:444", "session:555", "unrelated"]);
});

test("clear deletes in batches instead of one round-trip per key", async () => {
    const seed: Record<string, string> = {};
    for (let index = 0; index < 5; index++) seed[`stellequeue:${index}`] = "{}";

    const fake = createFakeRedis(seed);

    const store = new RedisQueueStore(fake as unknown as RedisClientType);
    store.namespace = "stellequeue";

    await store.clear();

    assert.deepEqual(fake.keys(), []);
    // Three pages of at most two keys each, not five separate deletes.
    assert.deepEqual(fake.calls, ["del:2", "del:2", "del:1"]);
});

test("clear is a no-op when the namespace holds nothing", async () => {
    const fake = createFakeRedis({ "internal:444": "{}" });

    const store = new RedisQueueStore(fake as unknown as RedisClientType);
    store.namespace = "stellequeue";

    await store.clear();

    assert.deepEqual(fake.keys(), ["internal:444"]);
    assert.deepEqual(fake.calls, []);
});
