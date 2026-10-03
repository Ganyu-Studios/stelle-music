import assert from "node:assert/strict";
import { test } from "node:test";
import { User } from "seyfert";

// `track.ts` pulls in seyfert (for `User`) but reads no config at import time, so (like the selection/seek tests) it
// needs no env stubbing.
import { TrackOps } from "#stelle/utils/functions/internal/track.js";

/**
 * Build a real `User` instance without a client: `requesterFn` only does `instanceof User`, reads own props via
 * `Object.entries` (id/username) and the prototype `tag` getter (globalName ?? username#discriminator). Seyfert stores
 * the raw data as own enumerable props (Base/DiscordBase `Object.assign(this, ...)`), which is exactly what we mimic.
 */
function makeUser(data: Record<string, unknown>): User {
    return Object.assign(Object.create(User.prototype), data) as User;
}

test("strips a user down to id, username and tag (drops everything else)", () => {
    const user = makeUser({
        // Own props seyfert would carry that must NOT leak into the requester snapshot.
        client: {},
        email: "secret@user.dev",
        discriminator: "0",
        bot: false,
        globalName: "Aaron",
        id: "123",
        username: "aaron",
    });

    assert.deepEqual(TrackOps.requesterFn(user), { id: "123", username: "aaron", tag: "Aaron" });
});

test("falls back to username#discriminator when the user has no global name", () => {
    const user = makeUser({ id: "1", username: "legacy", discriminator: "1234", globalName: null, bot: false });

    assert.deepEqual(TrackOps.requesterFn(user), { id: "1", username: "legacy", tag: "legacy#1234" });
});

test("uses the username as the tag for bots", () => {
    const user = makeUser({ id: "9", username: "Stelle", discriminator: "0", globalName: "Stelle", bot: true });

    // Bots get the plain username, not the `tag` getter value.
    assert.deepEqual(TrackOps.requesterFn(user), { id: "9", username: "Stelle", tag: "Stelle" });
});

test("returns a non-user requester (an already-stored snapshot) unchanged", () => {
    const snapshot = { id: "42", username: "cached", tag: "cached" };

    // Not a `User` instance, so it passes through untouched (same reference).
    assert.equal(TrackOps.requesterFn(snapshot), snapshot);
});
