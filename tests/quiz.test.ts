import assert from "node:assert/strict";
import { test } from "node:test";

// `configuration.ts` parses `process.env` at import time; the quiz matcher only transitively imports `UtilsOps`
// (no config/DB), but set dummy env defaults anyway so the transitive `Environment.parse` never throws.
process.env.TOKEN ||= "test-token";
process.env.DATABASE_URL ||= "mongodb://127.0.0.1:27017/stelle-test";
process.env.ERRORS_WEBHOOK ||= "https://example.com/webhook";
process.env.REDIS_HOST ||= "127.0.0.1";
process.env.REDIS_PORT ||= "6379";
process.env.REDIS_PASSWORD ||= "test";

const { matches } = await import("#stelle/utils/functions/internal/quiz.js");

/**
 * Guesses that SHOULD be accepted for a given target, grouped by what tolerance they exercise.
 */
const ACCEPT: Array<[guess: string, target: string, why: string]> = [
    ["Blinding Lights", "Blinding Lights", "exact"],
    ["blinding lights", "Blinding Lights", "case"],
    ["beyonce", "Beyoncé", "diacritics"],
    ["save your tears", "Save Your Tears (feat. Ariana Grande)", "parenthetical feat"],
    ["bohemian rhapsody", "Bohemian Rhapsody (Remastered 2011)", "bracketed qualifier"],
    ["simon and garfunkel", "Simon & Garfunkel", "ampersand"],
    ["kendrick lamar", "Kendrick Lamar feat. SZA", "feat tail on artist"],
    ["blinding lightss", "Blinding Lights", "typo (extra char)"],
    ["blindng lights", "Blinding Lights", "typo (missing char)"],
    ["dont stop me now", "Don't Stop Me Now", "apostrophe"],
    ["Lil Nas X", "lil nas x - MONTERO (Call Me By Your Name)", "subphrase before dash"],
];

/**
 * Guesses that SHOULD be rejected (different track/artist, or too vague to count).
 */
const REJECT: Array<[guess: string, target: string, why: string]> = [
    ["hello", "Blinding Lights", "unrelated"],
    ["love", "Love Story", "single common word must not match"],
    ["taylor swift", "Kanye West", "different artist"],
    ["the weeknd", "Blinding Lights", "artist guessed for a title target"],
    ["", "Blinding Lights", "empty guess"],
    ["stairway", "Highway to Hell", "single word, unrelated"],
];

for (const [guess, target, why] of ACCEPT) {
    test(`accepts "${guess}" ~ "${target}" (${why})`, (): void => {
        assert.equal(matches(guess, target), true);
    });
}

for (const [guess, target, why] of REJECT) {
    test(`rejects "${guess}" ~ "${target}" (${why})`, (): void => {
        assert.equal(matches(guess, target), false);
    });
}
