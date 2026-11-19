import assert from "node:assert/strict";
import { test } from "node:test";
import type { BoundCacheAdapterFactory, CacheAdapter, CacheAdapterOptions } from "#stelle/classes/modules/adapters/CacheAdapter.js";

/**
 * Register the `CacheAdapter` contract tests for one backend: the rules every adapter must follow so the controllers
 * behave the same on any of them (see the `CacheAdapter` docs). Run it against a custom adapter to validate it:
 * ```ts
 * cacheAdapterContract("my adapter", <T>(options) => new MyCacheAdapter<T>(options, client));
 * ```
 * @param {string} name The backend name, used to label the tests.
 * @param {BoundCacheAdapterFactory} createAdapter A factory whose adapters all share one store, so the namespace
 * isolation checks are meaningful for backends where collections live side by side (e.g. one Redis database).
 * @returns {void}
 */
export function cacheAdapterContract(name: string, createAdapter: BoundCacheAdapterFactory): void {
    // Every test uses its own namespaces, so tests sharing one store can't see each other's keys.
    let namespaces: number = 0;
    const options = (namespace: string): CacheAdapterOptions => ({ limit: 100, expire: 300_000, namespace });
    const adapter = <T>(): CacheAdapter<T> => createAdapter<T>(options(`contract-${++namespaces}`));

    test(`${name}: a key that was never set is a miss (undefined)`, async (): Promise<void> => {
        const cache = adapter<string>();

        assert.equal(await cache.get("missing"), undefined);
        assert.equal(await cache.has("missing"), false);
    });

    test(`${name}: set stores a value and returns the adapter`, async (): Promise<void> => {
        const cache = adapter<{ value: string }>();

        assert.equal(await cache.set("present", { value: "cached" }), cache);
        assert.deepEqual(await cache.get("present"), { value: "cached" });
        assert.equal(await cache.has("present"), true);
    });

    test(`${name}: a cached null (negative cache) stays null, apart from a miss`, async (): Promise<void> => {
        const cache = adapter<string | null>();

        await cache.set("negative", null);

        assert.equal(await cache.get("negative"), null);
        assert.equal(await cache.has("negative"), true);
    });

    test(`${name}: a Date comes back as a Date`, async (): Promise<void> => {
        const cache = adapter<{ createdAt: Date }>();
        const createdAt = new Date("2026-01-01T00:00:00.000Z");

        await cache.set("dated", { createdAt });
        const cached = await cache.get("dated");

        assert.ok(cached?.createdAt instanceof Date, "a Date must not come back as an ISO string");
        assert.equal(cached.createdAt.getTime(), createdAt.getTime());
    });

    test(`${name}: set overwrites the previous value`, async (): Promise<void> => {
        const cache = adapter<number>();

        await cache.set("key", 1);
        await cache.set("key", 2);

        assert.equal(await cache.get("key"), 2);
    });

    test(`${name}: delete removes a value and reports whether it existed`, async (): Promise<void> => {
        const cache = adapter<number>();

        await cache.set("key", 1);

        assert.equal(await cache.delete("key"), true);
        assert.equal(await cache.get("key"), undefined);
        assert.equal(await cache.delete("key"), false);
    });

    test(`${name}: collections with different namespaces don't share keys`, async (): Promise<void> => {
        const first = adapter<string>();
        const second = adapter<string>();

        await first.set("guild-1", "first");
        await second.set("guild-1", "second");

        assert.equal(await first.get("guild-1"), "first");
        assert.equal(await second.get("guild-1"), "second");
    });

    test(`${name}: clear only empties its own collection`, async (): Promise<void> => {
        const first = adapter<string>();
        const second = adapter<string>();

        await first.set("a", "first");
        await first.set("b", "first");
        await second.set("a", "second");

        await first.clear();

        assert.equal(await first.get("a"), undefined);
        assert.equal(await first.get("b"), undefined);
        assert.equal(await second.get("a"), "second", "another collection's keys must survive the clear");
    });
}
