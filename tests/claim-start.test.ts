import assert from "node:assert/strict";
import { test } from "node:test";

const { PlayerOps } = await import("#stelle/utils/functions/manager/player.js");

/**
 * A fake player whose `data` is a Map-backed store (the subset of hoshimi's PlayerMemoryStorage `claimStart` uses).
 * @returns {{ player: never; store: Map<string, unknown> }} The fake player and its backing store.
 */
function fakePlayer(): { player: never; store: Map<string, unknown> } {
    const store: Map<string, unknown> = new Map();
    const player = {
        data: {
            get: (key: string): unknown => store.get(key),
            set: (key: string, value: unknown): void => void store.set(key, value),
            delete: (key: string): boolean => store.delete(key),
        },
    } as never;

    return { player, store };
}

/**
 * A fake track carrying only the `encoded` string `claimStart` compares.
 * @param {string} encoded The encoded track.
 * @returns {never} The fake track.
 */
const track = (encoded: string): never => ({ encoded }) as never;

test("claimStart: announces a new track and remembers it", async (): Promise<void> => {
    const { player, store } = fakePlayer();

    assert.equal(await PlayerOps.claimStart(player, track("a")), true);
    assert.equal(store.get("announcedTrack"), "a");
});

test("claimStart: rejects a repeated start of the still-playing track", async (): Promise<void> => {
    const { player } = fakePlayer();

    await PlayerOps.claimStart(player, track("a"));

    assert.equal(await PlayerOps.claimStart(player, track("a")), false, "a voice-reconnect re-send must not re-announce");
});

test("claimStart: announces a different track", async (): Promise<void> => {
    const { player, store } = fakePlayer();

    await PlayerOps.claimStart(player, track("a"));

    assert.equal(await PlayerOps.claimStart(player, track("b")), true);
    assert.equal(store.get("announcedTrack"), "b");
});

test("claimStart: announces the same track again once its end cleared the claim (loop)", async (): Promise<void> => {
    const { player, store } = fakePlayer();

    await PlayerOps.claimStart(player, track("a"));
    store.delete("announcedTrack"); // what the TrackEnd / QueueEnd events do

    assert.equal(await PlayerOps.claimStart(player, track("a")), true);
});

test("claimStart: rejects the re-send after a restart restored the claim from the session", async (): Promise<void> => {
    const { player, store } = fakePlayer();
    store.set("announcedTrack", "a"); // what resumeListener restores

    assert.equal(await PlayerOps.claimStart(player, track("a")), false);
});
