/**
 * Time format methods interface.
 */
interface TimeFormatter {
    toHumanize(time: undefined): void;
    toHumanize(time: number): string;
    toHumanize(time: number | undefined): string | void;

    toDotted(time: undefined): void;
    toDotted(time: number): string;
    toDotted(time: number | undefined): string | void;

    toMs(date: string): number;

    ms(from: string): number;
    ms(from: number): string;
    ms(from: string | number): string | number;
}

/**
 * Time record type.
 */
type TimeRecord = Record<string, number>;

/**
 * Time units enum.
 */
export enum TimeUnits {
    Millisecond = 1,
    Second = 1000,
    Minute = 60 * TimeUnits.Second, // 60_000
    Hour = 60 * TimeUnits.Minute, // 3_600_000
    Day = 24 * TimeUnits.Hour, // 8_640_000
    Week = 7 * TimeUnits.Day, // 604_800_000
}

/**
 * Time units order object.
 */
const TimeUnitsOrder = {
    ms: TimeUnits.Millisecond,
    s: TimeUnits.Second,
    m: TimeUnits.Minute,
    h: TimeUnits.Hour,
    d: TimeUnits.Day,
    w: TimeUnits.Week,
};

/**
 *
 * Create a time formater.
 * @param {boolean} isNormalMode Whether to use normal mode or dotted mode.
 * @param {typeof TimeUnitsOrder} order Time units order.
 * @returns Time format methods.
 */
const createMsFormater = (isNormalMode: boolean = true, order: typeof TimeUnitsOrder = TimeUnitsOrder) => {
    const unitsLabels = Object.keys(order) as (keyof typeof order)[];
    const unitsValues = Object.values(order) as number[];

    const isDottedMode = isNormalMode === false;

    function baseFormater(time: number = 0, isChild = false): [string, number] {
        let targetPosition = 0;
        let targetUnitValue = 1;

        for (let i = 0; i < unitsValues.length; i++) {
            const unitValue = unitsValues[i]!;

            if (time < unitValue) break;

            targetPosition = i;
            targetUnitValue = unitValue;
        }

        const unitName = unitsLabels[targetPosition]!;

        const resultTime = Math.floor(time / targetUnitValue).toString();

        let more = time % targetUnitValue;
        let result = resultTime + unitName;

        if (isDottedMode) {
            if (more < 1000) more = 0;
            if (targetPosition === 0) return ["00:00", targetPosition];

            result = isChild
                ? resultTime.padStart(2, "0")
                : // do 00:05
                  targetPosition <= 1
                  ? "00:".repeat(targetPosition) + resultTime.padStart(2, "0")
                  : resultTime;
        }

        if (more !== 0) {
            const [rest, pos] = baseFormater(more, true);
            if (isNormalMode) result += ` ${rest}`;
            else if (pos !== 0) {
                result += `${":00".repeat(targetPosition - pos - 1)}:${rest}`;
            }
        } else if (isDottedMode && targetPosition >= 1) {
            result += ":00".repeat(targetPosition - 1);
        }

        return [result, targetPosition];
    }

    function formater(time: undefined): void;
    function formater(time: number): string;
    function formater(time: number | undefined): string | void;
    function formater(time: number | undefined): string | void {
        if (time === undefined) return;
        return baseFormater(time)[0];
    }

    return formater;
};

/**
 *
 * Create aliases for time units.
 * @param {TimeRecord} base The base time record.
 * @param {Record<keyof TimeRecord, string[]>} modifiers The modifiers to create aliases.
 * @returns {TimeRecord} The time record with aliases.
 */
const createAliases = <const R extends TimeRecord, M extends Record<keyof R, string[]>>(base: R, modifiers: M): TimeRecord => {
    const result = { ...base } as TimeRecord;

    for (const [from, aliases] of Object.entries(modifiers)) {
        const value = base[from];

        for (const alias of aliases) {
            result[alias] = value;
        }
    }

    return result;
};

const TimeUnitsAliases = createAliases(TimeUnitsOrder, {
    ms: ["milliseconds", "millisecond", "millisec", "millisecs"],
    s: ["seconds", "sec", "second", "secs"],
    m: ["minutes", "min", "minute", "mins"],
    h: ["hours", "hour", "hr", "hrs"],
    d: ["days", "day"],
    w: ["weeks", "week"],
});

const stringToMsRegex = /([0-9][_,.0-9]*)\s*([a-zA-Z]+)/g;
const undescoreAndLastCommaRegex = /_|[,.]+$/g;

/**
 *
 * Sanitize a number string.
 * @param {string} value The value to sanitize.
 * @returns {number} The sanitized value.
 */
const sanitizeNumber = (value: string): number => Number(value.replaceAll(undescoreAndLastCommaRegex, "").replaceAll(",", "."));

/**
 *
 * Convert a string to milliseconds.
 * @param {string} date The date string to convert.
 * @returns {number} The milliseconds value.
 */
const formatToMs = (date: string): number => {
    let result = 0;

    const matches = date.matchAll(stringToMsRegex);

    for (const [, value, unit] of matches) {
        const unitValue = TimeUnitsAliases[unit.toLowerCase()];
        if (unitValue === undefined) continue;
        result += sanitizeNumber(value) * unitValue;
    }

    return result;
};
/**
 * Convert milliseconds to a string and string to milliseconds.
 * @example "3600000 => 1h"
 * @example "1h => 3600000"
 */
export function ms(from: string): number;
export function ms(from: number): string;
export function ms(from: string | number): string | number {
    if (typeof from === "string") return formatToMs(from);
    return TimeFormat.toHumanize(from);
}

/**
 * Time format utilities.
 * @type {TimeFormatter}
 */
export const TimeFormat: TimeFormatter = {
    /**
     * Convert milliseconds to a string format.
     * @example "1h 4s"
     */
    toHumanize: createMsFormater(),
    /**
     * Convert milliseconds to a string dotted format.
     * This not show ms.
     * @example "1:00:04"
     */
    toDotted: createMsFormater(false),
    /**
     * Convert a string to milliseconds.
     * @example "1h => 3600000"
     */
    toMs: formatToMs,
    /**
     * Convert milliseconds to a string and string to milliseconds.
     * @example "3600000 => 1h"
     * @example "1h => 3600000"
     */
    ms,
};
