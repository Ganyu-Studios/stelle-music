import assert from "node:assert/strict";
import { test } from "node:test";

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

// The real bot loads `Configuration` dynamically from the config files; the cache only needs `cache.size`/`cache.expire`
// to build its `LimitedCollection`s, so stub just that instead of running the whole file loader in a test.
Object.assign(Configuration, { cache: { size: 100, expire: 300_000 } });

const { Cache } = await import("#stelle/classes/modules/Cache.js");
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

test("a playlist read returns a clone, so mutating it can't poison the cache", async (): Promise<void> => {
    const { model } = countingModel({ playlistId: "pl-1", userId: "user-1", public: false, tracks: [] });
    const playlist = new PlaylistController(...fakeDeps({ userPlaylist: model }));

    const first = await playlist.get("pl-1", "user-1");
    (first as { tracks: unknown[] }).tracks.push("mutated");

    const second = await playlist.get("pl-1", "user-1");
    assert.deepEqual((second as { tracks: unknown[] }).tracks, [], "the cached copy must be untouched by caller mutation");
});
