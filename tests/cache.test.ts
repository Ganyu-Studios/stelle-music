import assert from "node:assert/strict";
import { test } from "node:test";
import type { CacheAdapter } from "#stelle/classes/modules/adapters/CacheAdapter.js";

// `configuration.ts` parses `process.env` at import time (`Environment.parse`), so importing the cache or any
// controller would throw without these. Dummy values are enough: the tests inject a fake Prisma model and never open a
// real connection.
process.env.TOKEN ||= "test-token";
process.env.DATABASE_URL ||= "mongodb://127.0.0.1:27017/stelle-test";
process.env.ERRORS_WEBHOOK ||= "https://example.com/webhook";
process.env.REDIS_HOST ||= "127.0.0.1";
process.env.REDIS_PORT ||= "6379";
process.env.REDIS_PASSWORD ||= "test";

// Imported dynamically, after the env defaults above are set, so the transitive `Environment.parse` sees them.
const { Configuration } = await import("#stelle/utils/data/configuration.js");

// The real bot loads `Configuration` dynamically from the config files; the cache only needs `cache.limit`/`cache.expire`
// to build its in-memory adapters, so stub just that instead of running the whole file loader in a test.
Object.assign(Configuration, { cache: { adapter: "memory", limit: 100, expire: 300_000 } });

const { Cache } = await import("#stelle/classes/modules/Cache.js");
const { MemoryCacheAdapter } = await import("#stelle/classes/modules/adapters/MemoryCacheAdapter.js");
const { RedisCacheAdapter } = await import("#stelle/classes/modules/adapters/RedisCacheAdapter.js");
const { LocaleController } = await import("#stelle/controllers/locale.js");
const { PrefixController } = await import("#stelle/controllers/prefix.js");
const { PlayerController } = await import("#stelle/controllers/player.js");
const { PlaylistController } = await import("#stelle/controllers/playlist.js");

/**
 * The default config values a controller falls back to when a record is absent. Mirrors the shape the controllers read
 * from `this.client.config`.
 */
const config = {
    defaultLocale: "en-US",
    defaultPrefix: "stelle",
    defaultVolume: 60,
    defaultSearchSource: "spsearch",
} as const;

test("the default cache backend is the in-memory adapter", (): void => {
    const adapter = new MemoryCacheAdapter<{ value: string } | null>({ limit: 2, expire: 300_000, namespace: "test" });

    adapter.set("present", { value: "cached" });
    adapter.set("negative", null);

    assert.deepEqual(adapter.get("present"), { value: "cached" });
    assert.equal(adapter.get("negative"), null);
    assert.equal(adapter.get("missing"), undefined);
});

test("the cache accepts an asynchronous adapter", async (): Promise<void> => {
    const createAsyncAdapter = <T>(options: { limit: number; expire: number; namespace: string }) => {
        const memory = new MemoryCacheAdapter<T>(options);

        const adapter: CacheAdapter<T> = {
            async get(key: string): Promise<T | undefined> {
                return memory.get(key);
            },
            async set(key: string, value: T): Promise<CacheAdapter<T>> {
                memory.set(key, value);
                return adapter;
            },
            async delete(key: string): Promise<boolean> {
                return memory.delete(key);
            },
            async has(key: string): Promise<boolean> {
                return memory.has(key);
            },
            async clear(): Promise<void> {
                memory.clear();
            },
        };

        return adapter;
    };

    const cache = new Cache(createAsyncAdapter);
    (await cache.guild("guild-1")).locale = null;

    assert.equal((await cache.getGuild("guild-1"))?.locale, null);
});

test("the Redis adapter scopes keys and applies its TTL", async (): Promise<void> => {
    const values = new Map<string, string>();
    const sets: { key: string; ttl: number }[] = [];
    const redis = {
        async get(key: string): Promise<string | null> {
            return values.get(key) ?? null;
        },
        async set(key: string, value: string, options: { EX: number }): Promise<void> {
            values.set(key, value);
            sets.push({ key, ttl: options.EX });
        },
        async del(keys: string | string[]): Promise<number> {
            const list = Array.isArray(keys) ? keys : [keys];
            return list.filter((key) => values.delete(key)).length;
        },
        async exists(key: string): Promise<number> {
            return values.has(key) ? 1 : 0;
        },
        async *scanIterator(options: { MATCH: string }): AsyncGenerator<string[]> {
            const prefix = options.MATCH.slice(0, -1);
            yield [...values.keys()].filter((key) => key.startsWith(prefix));
        },
    };
    const adapter = new RedisCacheAdapter<{ value: string }>(redis as never, {
        limit: 5,
        expire: 1_500,
        namespace: "guilds",
    });

    await adapter.set("guild-1", { value: "cached" });
    assert.deepEqual(await adapter.get("guild-1"), { value: "cached" });
    assert.deepEqual(sets, [{ key: "stellecache:guilds:guild-1", ttl: 2 }]);

    await adapter.clear();
    assert.equal(await adapter.get("guild-1"), undefined);
});

/**
 * Build the three dependencies a controller now receives: a fake `PrismaService` whose `model(name)` returns the
 * matching stub, a real `Cache` (so the caching behaviour under test is genuine), and a `client` carrying `config` for
 * the default fallbacks. Spread into the controller constructor.
 * @param {Record<string, unknown>} models The per-model stubs, keyed by Prisma model name.
 * @returns {[never, InstanceType<typeof Cache>, never]} The `[prisma, cache, client]` tuple, typed loosely.
 */
function fakeDeps(models: Record<string, unknown>): [never, InstanceType<typeof Cache>, never] {
    const prisma = { model: (name: string): unknown => models[name] } as never;
    const client = { config } as never;

    return [prisma, new Cache(), client];
}

/**
 * A `findUnique` stub that counts how many times it ran and always resolves to `value`. The call count is what the
 * tests assert on: a cached read must not reach the model, a non-cached read must.
 * @param {unknown} value The value every `findUnique` call resolves to.
 * @returns {{ model: { findUnique: () => Promise<unknown> }; state: { calls: number } }} The stub and its counter.
 */
function countingModel(value: unknown): { model: { findUnique: () => Promise<unknown> }; state: { calls: number } } {
    const state = { calls: 0 };

    return {
        model: {
            findUnique: (): Promise<unknown> => {
                state.calls++;
                return Promise.resolve(value);
            },
        },
        state,
    };
}

test("a guild scalar (locale) negatively caches an absent record", async (): Promise<void> => {
    const { model, state } = countingModel(null);
    const locales = new LocaleController(...fakeDeps({ guildLocale: model }));

    assert.equal(await locales.get("guild-1"), "en-US", "an absent locale falls back to the default");
    assert.equal(await locales.get("guild-1"), "en-US");
    assert.equal(state.calls, 1, "the second read must hit the negatively-cached null, not the database");
});

test("a guild scalar (prefix) negatively caches an absent record", async (): Promise<void> => {
    const { model, state } = countingModel(null);
    const prefixes = new PrefixController(...fakeDeps({ guildPrefix: model }));

    assert.equal(await prefixes.get("guild-1"), "stelle", "an absent prefix falls back to the default");
    assert.equal(await prefixes.get("guild-1"), "stelle");
    assert.equal(state.calls, 1, "the second read must hit the negatively-cached null, not the database");
});

test("a guild scalar (player) negatively caches an absent record", async (): Promise<void> => {
    const { model, state } = countingModel(null);
    const players = new PlayerController(...fakeDeps({ guildPlayer: model }));

    const first = await players.get("guild-1");
    assert.deepEqual(first, { defaultVolume: 60, searchPlatform: "spsearch" }, "an absent player falls back to defaults");
    await players.get("guild-1");
    assert.equal(state.calls, 1, "the second read must hit the negatively-cached null, not the database");
});

test("a guild scalar (locale) still caches a present record", async (): Promise<void> => {
    const { model, state } = countingModel({ id: "1", guildId: "guild-1", locale: "es-419" });
    const locales = new LocaleController(...fakeDeps({ guildLocale: model }));

    assert.equal(await locales.get("guild-1"), "es-419");
    assert.equal(await locales.get("guild-1"), "es-419");
    assert.equal(state.calls, 1, "the second read must hit the positive cache, not the database");
});

test("the global playlist collection caches a present record by playlist id", async (): Promise<void> => {
    const { model, state } = countingModel({ playlistId: "pl-1", userId: "user-1", public: false });
    const playlist = new PlaylistController(...fakeDeps({ userPlaylist: model }));

    assert.equal((await playlist.get("pl-1", "user-1"))?.playlistId, "pl-1");
    assert.equal((await playlist.get("pl-1", "user-1"))?.playlistId, "pl-1");
    assert.equal(state.calls, 1, "the second read must hit the positive cache, not the database");
});

test("the global playlist collection does NOT negatively cache an absent record", async (): Promise<void> => {
    const { model, state } = countingModel(null);
    const playlist = new PlaylistController(...fakeDeps({ userPlaylist: model }));

    assert.equal(await playlist.get("pl-1", "user-1"), null);
    assert.equal(await playlist.get("pl-1", "user-1"), null);
    // A null here means "not this user's playlist", not "no such playlist" — caching it would poison the real owner.
    assert.equal(state.calls, 2, "each miss must re-query rather than cache an owner-scoped null");
});

/**
 * A `findUnique` stub whose calls stay pending until the test resolves them, so a write can be landed while a read is
 * in flight. Each call is queued with its resolver.
 * @returns {{ model: { findUnique: () => Promise<unknown> }; pending: ((value: unknown) => void)[] }} The stub and its queue.
 */
function deferredModel(): { model: { findUnique: () => Promise<unknown> }; pending: ((value: unknown) => void)[] } {
    const pending: ((value: unknown) => void)[] = [];

    return {
        model: {
            findUnique: (): Promise<unknown> => new Promise((resolve): void => void pending.push(resolve)),
        },
        pending,
    };
}

test("a read in flight during a write doesn't cache the stale row it read", async (): Promise<void> => {
    const { model, pending } = deferredModel();
    const fresh = { id: "1", guildId: "guild-1", defaultVolume: 20, searchPlatform: "spsearch" };
    const players = new PlayerController(
        ...fakeDeps({ guildPlayer: { ...model, upsert: (): Promise<unknown> => Promise.resolve(fresh) } }),
    );

    // The read misses the cache and its query hangs, holding the row from before the write.
    const read = players.get("guild-1");
    await players.set("guild-1", { defaultVolume: 20 });
    pending.shift()?.({ ...fresh, defaultVolume: 80 });

    assert.equal((await read).defaultVolume, 20, "the read must return what the write cached, not its stale row");
    assert.equal((await players.get("guild-1")).defaultVolume, 20, "the stale row must not overwrite the cache");
    assert.equal(pending.length, 0, "the retry must be served by the cache, not re-query");
});

test("a read in flight during a delete doesn't re-cache the deleted row", async (): Promise<void> => {
    const { model, pending } = deferredModel();
    const row = { playlistId: "pl-1", userId: "user-1", public: false };
    const playlist = new PlaylistController(
        ...fakeDeps({ userPlaylist: { ...model, delete: (): Promise<unknown> => Promise.resolve(row) } }),
    );

    const read = playlist.get("pl-1", "user-1");
    await playlist.delete("user-1", "pl-1");
    pending.shift()?.(row);

    // The evict leaves the key empty, so the retry re-queries and sees the row gone.
    await new Promise((resolve): void => void setImmediate(resolve));
    assert.equal(pending.length, 1, "the retry must re-query after the evict");
    pending.shift()?.(null);

    assert.equal(await read, null, "the read must retry and see the row gone");
});

test("a delete of an already-missing row (P2025) still evicts the cached entry", async (): Promise<void> => {
    const rows: unknown[] = [{ playlistId: "pl-1", userId: "user-1", public: false }, null];
    const playlist = new PlaylistController(
        ...fakeDeps({
            userPlaylist: {
                findUnique: (): Promise<unknown> => Promise.resolve(rows.shift()),
                delete: (): Promise<unknown> => Promise.reject({ code: "P2025" }),
            },
        }),
    );

    // Cache the row, then delete it after it was already removed elsewhere.
    assert.equal((await playlist.get("pl-1", "user-1"))?.playlistId, "pl-1");
    await playlist.delete("user-1", "pl-1");

    assert.equal(await playlist.get("pl-1", "user-1"), null, "the cached row must be evicted, not served until it expires");
});

test("a failed delete (not P2025) rethrows and keeps the cached entry", async (): Promise<void> => {
    const { model, state } = countingModel({ playlistId: "pl-1", userId: "user-1", public: false });
    const playlist = new PlaylistController(
        ...fakeDeps({ userPlaylist: { ...model, delete: (): Promise<unknown> => Promise.reject(new Error("timeout")) } }),
    );

    await playlist.get("pl-1", "user-1");
    await assert.rejects(playlist.delete("user-1", "pl-1"), /timeout/);

    assert.equal((await playlist.get("pl-1", "user-1"))?.playlistId, "pl-1");
    assert.equal(state.calls, 1, "the row still exists, so the cache must keep serving it");
});

test("a playlist read returns a clone, so mutating it can't poison the cache", async (): Promise<void> => {
    const { model } = countingModel({ playlistId: "pl-1", userId: "user-1", public: false, tracks: [] });
    const playlist = new PlaylistController(...fakeDeps({ userPlaylist: model }));

    const first = await playlist.get("pl-1", "user-1");
    (first as { tracks: unknown[] }).tracks.push("mutated");

    const second = await playlist.get("pl-1", "user-1");
    assert.deepEqual((second as { tracks: unknown[] }).tracks, [], "the cached copy must be untouched by caller mutation");
});
