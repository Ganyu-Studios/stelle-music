import assert from "node:assert/strict";
import { test } from "node:test";

// `utils.ts` imports only node builtins and types, so (like the selection/seek tests) it needs no env stubbing.
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

test("compares primitives", () => {
    assert.equal(UtilsOps.deepEqual(1, 1), true);
    assert.equal(UtilsOps.deepEqual("a", "a"), true);
    assert.equal(UtilsOps.deepEqual(1, 2), false);
    assert.equal(UtilsOps.deepEqual(null, undefined), false);
    assert.equal(UtilsOps.deepEqual(null, null), true);
});

test("matches nested objects regardless of key order", () => {
    assert.equal(UtilsOps.deepEqual({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }), true);
    assert.equal(UtilsOps.deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 }), false);
});

test("compares arrays in order", () => {
    assert.equal(UtilsOps.deepEqual([1, 2, 3], [1, 2, 3]), true);
    assert.equal(UtilsOps.deepEqual([1, 2, 3], [3, 2, 1]), false);
    assert.equal(UtilsOps.deepEqual([1, 2], [1, 2, 3]), false);
    // An object is not an array even with matching numeric keys.
    assert.equal(UtilsOps.deepEqual([1], { 0: 1 }), false);
});

test("treats undefined-valued keys as absent (JSON semantics)", () => {
    // The stored session (JSON.parse) drops undefined fields; the freshly built one keeps them as own keys.
    assert.equal(UtilsOps.deepEqual({ id: "1", messageId: undefined }, { id: "1" }), true);
    assert.equal(UtilsOps.deepEqual({ id: "1" }, { id: "1", messageId: undefined }), true);
    // A defined value must still differ from an absent one.
    assert.equal(UtilsOps.deepEqual({ id: "1", messageId: "x" }, { id: "1" }), false);
});

test("gates a session write: position-only change reads equal, real change does not", () => {
    const base = { voiceId: "v", textId: "t", loop: 0, is247: false, lastPosition: 1000, position: 1000 };
    const omitPos = (s: typeof base) => UtilsOps.omit(s, ["lastPosition", "position"] as const);

    assert.equal(UtilsOps.deepEqual(omitPos(base), omitPos({ ...base, lastPosition: 5000, position: 5000 })), true);
    assert.equal(UtilsOps.deepEqual(omitPos(base), omitPos({ ...base, loop: 1, lastPosition: 5000, position: 5000 })), false);
});
