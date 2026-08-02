import { UtilsOps } from "./utils.js";

/**
 * The similarity ratio (0..1) at or above which a guess is accepted as a match. Tuned against the cases in
 * `tests/quiz.test.ts`: high enough to reject different titles, low enough to tolerate typos and minor variants.
 * @type {number}
 */
const MATCH_THRESHOLD: number = 0.82;

/**
 * Tokens dropped when normalizing a title/artist: the qualifier that starts a "feat." style tail and everything
 * after it is removed, since guessers almost never type the featured act or production credits.
 * @type {RegExp}
 */
const FEAT_TAIL: RegExp = /\b(feat|ft|featuring|prod|with)\b.*$/i;

/**
 *
 * Normalize a title or artist for fuzzy comparison: strip diacritics, lowercase, drop bracketed qualifiers
 * (`(Official Video)`, `[Remastered]`, …) and `feat.`/`prod.` tails, expand `&`, remove punctuation, and
 * collapse whitespace. The result is a bag of lowercase alphanumeric words separated by single spaces.
 * @param {string} text The raw title or artist.
 * @returns {string} The normalized comparison string.
 */
function normalize(text: string): string {
    return UtilsOps.sanitize(text)
        .toLowerCase()
        .replace(/[([{].*?[)\]}]/g, " ")
        .replace(FEAT_TAIL, " ")
        .replace(/&/g, " and ")
        .replace(/['’`´"]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 *
 * The Levenshtein edit distance between two strings (number of single-character insertions, deletions, or
 * substitutions). Uses a single rolling row, so it is O(a·b) time and O(b) space.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The edit distance.
 */
function levenshtein(a: string, b: string): number {
    const m: number = a.length;
    const n: number = b.length;

    if (!m) return n;
    if (!n) return m;

    const row: number[] = Array.from({ length: n + 1 }, (_, i): number => i);

    for (let i: number = 1; i <= m; i++) {
        let prev: number = row[0];
        row[0] = i;

        for (let j: number = 1; j <= n; j++) {
            const temp: number = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = temp;
        }
    }

    return row[n];
}

/**
 *
 * The normalized similarity ratio between two strings: `1` for identical, `0` for nothing in common.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The similarity ratio in `[0, 1]`.
 */
function ratio(a: string, b: string): number {
    const max: number = Math.max(a.length, b.length);
    if (!max) return 1;

    return 1 - levenshtein(a, b) / max;
}

export const QuizOps = {
    /**
     *
     * Normalize a title or artist for comparison (see {@link normalize}). Exposed so callers can pre-normalize
     * or display a canonical form.
     * @param {string} text The raw title or artist.
     * @returns {string} The normalized comparison string.
     */
    normalize(text: string): string {
        return normalize(text);
    },
    /**
     *
     * Whether `guess` should be accepted as a match for `target` (a track title or artist). Both are normalized,
     * then a match is any of: an exact normalized equality, a similarity ratio at or above {@link MATCH_THRESHOLD}
     * (tolerating typos and minor variants), or a multi-word guess whose every word appears in the target (so a
     * specific subphrase like `bohemian rhapsody` matches `Bohemian Rhapsody (Remastered 2011)`).
     * @param {string} guess The user's guess.
     * @param {string} target The track title or artist to match against.
     * @returns {boolean} True if the guess is close enough to count.
     */
    matches(guess: string, target: string): boolean {
        const g: string = normalize(guess);
        const t: string = normalize(target);

        if (!g || !t) return false;
        if (g === t) return true;
        if (ratio(g, t) >= MATCH_THRESHOLD) return true;

        // A specific multi-word subphrase counts (guards against single common words matching by accident).
        const words: string[] = g.split(" ");
        if (words.length >= 2) {
            const targetWords: Set<string> = new Set(t.split(" "));
            if (words.every((word): boolean => targetWords.has(word))) return true;
        }

        return false;
    },
};
