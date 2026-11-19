import assert from "node:assert/strict";
import { test } from "node:test";

// `selection.ts` is a pure function with no `#stelle` imports, so (unlike the cache/store tests) it needs no env
// stubbing — importing it never pulls in `configuration.ts`.
import { parseTrackSelection } from "#stelle/utils/functions/components/playlist/selection.js";

test("parses single indices, comma and whitespace separated", () => {
    assert.deepEqual(parseTrackSelection("1, 3, 5", 10), [1, 3, 5]);
    assert.deepEqual(parseTrackSelection("2 4\t6", 10), [2, 4, 6]);
});

test("expands ranges and deduplicates against overlapping singles", () => {
    assert.deepEqual(parseTrackSelection("5-7", 10), [5, 6, 7]);
    assert.deepEqual(parseTrackSelection("1, 2-4, 3", 10), [1, 2, 3, 4]);
});

test("supports the wildcard for the full range and as a range bound", () => {
    assert.deepEqual(parseTrackSelection("*", 4), [1, 2, 3, 4]);
    assert.deepEqual(parseTrackSelection("2-*", 4), [2, 3, 4]);
    assert.deepEqual(parseTrackSelection("*-3", 5), [1, 2, 3]);
});

test("returns indices sorted ascending regardless of input order", () => {
    assert.deepEqual(parseTrackSelection("9, 1, 5", 10), [1, 5, 9]);
});

test("rejects empty and malformed selections", () => {
    assert.throws(() => parseTrackSelection("   ", 10), /empty-selection/);
    assert.throws(() => parseTrackSelection("abc", 10), /invalid-selection/);
    assert.throws(() => parseTrackSelection("3-1", 10), /invalid-selection/);
    assert.throws(() => parseTrackSelection("0", 10), /invalid-selection/);
});

test("throws RangeError for a single index beyond the total", () => {
    assert.throws(() => parseTrackSelection("500", 10), RangeError);
});

test("bounds an oversized range before expanding it (DoS regression)", () => {
    // Before the guard, this expanded a Set of ~100 billion entries, blocking the event loop and exhausting memory.
    // It must now reject immediately with a RangeError instead of hanging.
    assert.throws(() => parseTrackSelection("1-99999999999", 1), RangeError);
});
