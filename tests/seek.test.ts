import assert from "node:assert/strict";
import { test } from "node:test";

// The seek command module pulls in seyfert but reads no config at import
// time, so (like the selection test) it needs no env stubbing.
import { parseSeekInput } from "../src/commands/music/seek.command.js";

test("parses single and combined unit inputs", () => {
    assert.equal(parseSeekInput("2min"), 120_000);
    assert.equal(parseSeekInput("90s"), 90_000);
    assert.equal(parseSeekInput("1h 30m"), 5_400_000);
    assert.equal(parseSeekInput("1h,30m"), 5_400_000);
});

test("rejects text that parses to nothing instead of seeking to 0", () => {
    assert.equal(parseSeekInput("abc"), null);
    assert.equal(parseSeekInput("1:30"), null);
    assert.equal(parseSeekInput("90"), null);
    assert.equal(parseSeekInput(""), null);
    assert.equal(parseSeekInput("   "), null);
});

test("rejects zero and negative positions", () => {
    assert.equal(parseSeekInput("0"), null);
    assert.equal(parseSeekInput("0s"), null);
});
