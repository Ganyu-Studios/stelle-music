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
 * Tidy a raw title/artist for display: drop bracketed qualifiers (`(Official Video)`, `[Remastered]`, and the
 * CJK/full-width `【…】`「…」（…） variants), the `song / artist` tail, and `cover …` / `feat. …` tails, while keeping
 * the original casing and script (so a Japanese title stays readable). Falls back to the raw text if it strips to
 * nothing.
 * @param {string} text The raw title or artist.
 * @returns {string} The tidied text.
 */
export function clean(text: string): string {
    const tidied: string = text
        .replace(/[([{（【「『〔《][^)\]}）】」』〕》]*[)\]}）】」』〕》]/gu, " ")
        .replace(/\s\/\s.*$/u, " ")
        .replace(/\bcover\b.*$/iu, " ")
        .replace(FEAT_TAIL, " ")
        .replace(/\s+/g, " ")
        .trim();

    return tidied || text.trim();
}

/**
 *
 * Normalize a title or artist for fuzzy comparison: {@link clean} it, strip diacritics, lowercase, expand `&`,
 * and drop punctuation, keeping unicode letters/numbers (so CJK titles survive as matchable tokens instead of
 * normalizing to an empty, never-matchable string). The result is a bag of lowercase words separated by spaces.
 * @param {string} text The raw title or artist.
 * @returns {string} The normalized comparison string.
 */
export function normalize(text: string): string {
    return UtilsOps.sanitize(clean(text))
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/['’`´"]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
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
export function matches(guess: string, target: string): boolean {
    const g: string = normalize(guess);
    const t: string = normalize(target);

    if (!g || !t) return false;
    if (g === t) return true;
    if (ratio(g, t) >= MATCH_THRESHOLD) return true;

    const guessWords: string[] = g.split(" ");
    const targetWords: string[] = t.split(" ");
    const guessSet: Set<string> = new Set(guessWords);
    const targetSet: Set<string> = new Set(targetWords);

    // A specific multi-word guess that is a subphrase of the target (guards single common words by accident).
    if (guessWords.length >= 2 && guessWords.every((word): boolean => targetSet.has(word))) return true;

    // The guess contains the whole target — the user typed the title and artist together, or added extra words.
    // Requires a non-trivial target so a short common word can't match just by appearing in a long guess.
    if (t.length >= 4 && targetWords.every((word): boolean => guessSet.has(word))) return true;

    return false;
}
