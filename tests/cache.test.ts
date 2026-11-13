import assert from "node:assert/strict";
import { test } from "node:test";
import type {
    BoundCacheAdapterFactory,
    CacheAdapter,
    CacheAdapterFactory,
    CacheAdapterOptions,
} from "#stelle/classes/modules/adapters/CacheAdapter.js";
import { cacheAdapterContract } from "./helpers/cache-adapter-contract.js";

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
const { createCacheAdapterFactory } = await import("#stelle/classes/modules/adapters/CacheAdapterFactory.js");
const { LocaleController } = await import("#stelle/controllers/locale.js");
const { PrefixController } = await import("#stelle/controllers/prefix.js");
const { PlayerController } = await import("#stelle/controllers/player.js");
const { PlaylistController } = await import("#stelle/controllers/playlist.js");
const { RequestsController } = await import("#stelle/controllers/requests.js");

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

cacheAdapterContract("memory adapter", <T>(options: CacheAdapterOptions) => new MemoryCacheAdapter<T>(options));

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
    await cache.locales.set("guild-1", null);

    assert.equal(await cache.locales.get("guild-1"), null);
});

/**
 * An in-memory stand-in for the Redis client, covering the commands the Redis adapter uses. Values are kept as the
 * strings the adapter writes, so every `get` decodes a fresh copy exactly like a real Redis round trip.
 * @returns {{ redis: never; values: Map<string, string>; sets: { key: string; ttl: number }[] }} The client, its store and the recorded `set`s.
 */
function fakeRedis(): { redis: never; values: Map<string, string>; sets: { key: string; ttl: number }[] } {
    const values = new Map<string, string>();
    const sets: { key: string; ttl: number }[] = [];
    const redis = {
        async get(key: string): Promise<string | null> {
            return values.get(key) ?? null;
        },
        async set(key: string, value: string, _ex: "EX", seconds: number): Promise<void> {
            values.set(key, value);
            sets.push({ key, ttl: seconds });
        },
        async del(...keys: string[]): Promise<number> {
            return keys.filter((key) => values.delete(key)).length;
        },
        async exists(key: string): Promise<boolean> {
            return values.has(key);
        },
        async scan(_cursor: string, _match: "MATCH", pattern: string): Promise<[string, string[]]> {
            const prefix = pattern.slice(0, -1);
            return ["0", [...values.keys()].filter((key) => key.startsWith(prefix))];
        },
    };

    return { redis: redis as never, values, sets };
}

test("the Redis adapter scopes keys and applies its TTL", async (): Promise<void> => {
    const { redis, sets } = fakeRedis();
    const adapter = new RedisCacheAdapter<{ value: string }>(redis, {
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

cacheAdapterContract("Redis adapter", redisFactory());

test("the Redis adapter treats an undecodable entry (the older JSON encoding) as a miss", async (): Promise<void> => {
    const { redis, values } = fakeRedis();
    const adapter = new RedisCacheAdapter<{ value: string }>(redis, { limit: 5, expire: 1_500, namespace: "test" });

    values.set("stellecache:test:legacy", JSON.stringify({ value: "cached" }));

    assert.equal(await adapter.get("legacy"), undefined);
});

test("the configured backend resolves a built-in name or a custom factory", (): void => {
    const { redis } = fakeRedis();
    const options: CacheAdapterOptions = { limit: 5, expire: 1_500, namespace: "test" };
    const withAdapter = (adapter: unknown): never => ({ config: { cache: { adapter } }, redis }) as never;

    assert.ok(createCacheAdapterFactory(withAdapter("memory"))(options) instanceof MemoryCacheAdapter);
    assert.ok(createCacheAdapterFactory(withAdapter("redis"))(options) instanceof RedisCacheAdapter);

    const calls: { options: CacheAdapterOptions; client: unknown }[] = [];
    const custom: CacheAdapterFactory = <T>(options: CacheAdapterOptions, client: unknown): CacheAdapter<T> => {
        calls.push({ options, client });
        return new MemoryCacheAdapter<T>(options);
    };
    const client = withAdapter(custom);

    createCacheAdapterFactory(client)(options);
    assert.deepEqual(calls, [{ options, client }], "a custom factory must receive the collection options and the client");
});

/**
 * Build the three dependencies a controller now receives: a fake `PrismaService` whose `model(name)` returns the
 * matching stub, a real `Cache` (so the caching behaviour under test is genuine), and a `client` carrying `config` for
 * the default fallbacks. Spread into the controller constructor.
 * @param {Record<string, unknown>} models The per-model stubs, keyed by Prisma model name.
 * @param {BoundCacheAdapterFactory} [createAdapter] The cache backend. Memory (the `Cache` default) when omitted.
 * @returns {[never, InstanceType<typeof Cache>, never]} The `[prisma, cache, client]` tuple, typed loosely.
 */
function fakeDeps(models: Record<string, unknown>, createAdapter?: BoundCacheAdapterFactory): [never, InstanceType<typeof Cache>, never] {
    const prisma = { model: (name: string): unknown => models[name] } as never;
    const client = { config } as never;

    return [prisma, new Cache(createAdapter), client];
}

/**
 * A cache backend factory over a fresh {@link fakeRedis} client, for running the controllers on the Redis adapter.
 * @returns {BoundCacheAdapterFactory} The adapter factory.
 */
function redisFactory(): BoundCacheAdapterFactory {
    const { redis } = fakeRedis();
    return <T>(options: CacheAdapterOptions) => new RedisCacheAdapter<T>(redis, options);
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

test("every guild config is actually cached on the Redis adapter", async (): Promise<void> => {
    const record = { id: "1", guildId: "guild-1", locale: "es-419", prefix: "!", defaultVolume: 80, searchPlatform: "ytsearch" };
    const controllers = [
        ["locale", LocaleController, "guildLocale"],
        ["prefix", PrefixController, "guildPrefix"],
        ["player", PlayerController, "guildPlayer"],
        ["requests", RequestsController, "guildRequestChannel"],
    ] as const;

    for (const [name, Controller, modelName] of controllers) {
        const { model, state } = countingModel(record);
        const controller = new Controller(...fakeDeps({ [modelName]: model }, redisFactory()));

        await controller.get("guild-1");
        await controller.get("guild-1");
        assert.equal(state.calls, 1, `the second ${name} read must hit Redis, not the database`);
    }
});

test("writes to different configs of one guild don't clobber each other on the Redis adapter", async (): Promise<void> => {
    const { model, state } = countingModel(null);
    const createAdapter = redisFactory();
    const [prisma, cache, client] = fakeDeps(
        {
            guildLocale: { ...model, upsert: (): Promise<unknown> => Promise.resolve({ id: "1", guildId: "guild-1", locale: "es-419" }) },
            guildPlayer: {
                ...model,
                upsert: (): Promise<unknown> =>
                    Promise.resolve({ id: "2", guildId: "guild-1", defaultVolume: 20, searchPlatform: "spsearch" }),
            },
        },
        createAdapter,
    );
    const locales = new LocaleController(prisma, cache, client);
    const players = new PlayerController(prisma, cache, client);

    await Promise.all([locales.update("guild-1", "es-419"), players.set("guild-1", { defaultVolume: 20 })]);

    assert.equal(await locales.get("guild-1"), "es-419");
    assert.equal((await players.get("guild-1")).defaultVolume, 20);
    assert.equal(state.calls, 0, "both writes must land in the cache, so neither read reaches the database");
});

test("a cached playlist keeps its Date fields on the Redis adapter", async (): Promise<void> => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const { model, state } = countingModel({ playlistId: "pl-1", userId: "user-1", public: false, createdAt, tracks: [] });
    const playlist = new PlaylistController(...fakeDeps({ userPlaylist: model }, redisFactory()));

    await playlist.get("pl-1", "user-1");
    const cached = await playlist.get("pl-1", "user-1");

    assert.equal(state.calls, 1, "the second read must hit Redis, not the database");
    assert.ok(cached?.createdAt instanceof Date, "createdAt must come back as a Date, not an ISO string");
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
