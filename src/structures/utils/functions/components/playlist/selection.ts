/**
 * Parse the track selection entered by the user.
 * Accepts comma or whitespace separated numbers and ranges like `1, 3, 5-7, 11-*`.
 * @param {string} value The raw selection provided by the user.
 * @param {number} total The total amount of tracks in the playlist.
 * @returns {number[]} The selected track indexes in ascending order.
 */
export function parseTrackSelection(value: string, total: number): number[] {
    const normalized: string = value.replace(/\s*-/g, "-").trim();
    const tokens: string[] = normalized
        .split(/[\s,]+/)
        .map((token): string => token.trim())
        .filter(Boolean);

    if (!tokens.length) throw new Error("empty-selection");

    const selection = new Set<number>();

    for (const token of tokens) {
        if (token === "*") {
            for (let index: number = 1; index <= total; index += 1) selection.add(index);
            continue;
        }

        const parts: string[] = token.split("-");

        if (parts.length === 2) {
            const [startRaw, endRaw] = parts;

            const startWildcard: boolean = startRaw === "*";
            const endWildcard: boolean = endRaw === "*";

            if (!startWildcard && !/^\d+$/.test(startRaw)) throw new Error("invalid-selection");
            if (!endWildcard && !/^\d+$/.test(endRaw)) throw new Error("invalid-selection");

            const start: number = startWildcard ? 1 : Number(startRaw);
            const end: number = endWildcard ? total : Number(endRaw);

            if (start < 1 || end < 1 || start > end) throw new Error("invalid-selection");
            // Bound the range against `total` BEFORE expanding it: otherwise `1-99999999999` would try to build a
            // Set of billions of entries, blocking the event loop and exhausting memory before the out-of-range
            // check below is ever reached.
            if (end > total) throw new RangeError("out-of-range");

            for (let index: number = start; index <= end; index += 1) selection.add(index);

            continue;
        }

        if (parts.length !== 1 || !/^\d+$/.test(parts[0])) throw new Error("invalid-selection");

        const index: number = Number(parts[0]);
        if (index < 1) throw new Error("invalid-selection");

        selection.add(index);
    }

    const selected: number[] = [...selection].sort((a, b): number => a - b);

    if (!selected.length) throw new Error("invalid-selection");
    if (selected.some((index): boolean => index > total)) throw new RangeError("out-of-range");

    return selected;
}
