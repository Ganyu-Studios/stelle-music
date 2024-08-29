export enum TimeUnits {
    Millisecond = 1,
    Second = 1000,
    Minute = 60 * TimeUnits.Second, // 60_000
    Hour = 60 * TimeUnits.Minute, // 3_600_000
    Day = 24 * TimeUnits.Hour, // 8_640_000
    Week = 7 * TimeUnits.Day, // 604_800_000
}

const TimeUnitsOrder = {
    s: TimeUnits.Second,
    m: TimeUnits.Minute,
    h: TimeUnits.Hour,
    d: TimeUnits.Day,
    w: TimeUnits.Week,
};

const createMsFormater = (isNormalMode = true) => {
    const unitsLabels = Object.keys(TimeUnitsOrder) as (keyof typeof TimeUnitsOrder)[];
    const unitsValues = Object.values(TimeUnitsOrder) as number[];

    const isDottedMode = isNormalMode === false;

    function baseFormater(time: number = 0, isChild = false): [string, number] {
        let targetPosition = 0;
        let targetUnitValue = 1;

        for (let i = 0; i < unitsValues.length; i++) {
            const unitValue = unitsValues[i];

            if (time < unitValue) break;

            targetPosition = i + 1;
            targetUnitValue = unitValue;
        }

        const unitName = unitsLabels[targetPosition - 1];

        const resultTime = Math.floor(time / targetUnitValue);
        const more = time % targetUnitValue;

        if (resultTime === 0) return ["", 0];
        if (unitName === undefined) return [`${resultTime}ms`, 0];

        let result = isNormalMode ? resultTime + unitName : isChild ? resultTime.toString().padStart(2, "0") : resultTime.toString();

        if (more !== 0) {
            const [rest, pos] = baseFormater(more, true);
            if (isNormalMode) result += ` ${rest}`;
            else if (pos !== 0) {
                result += `${":00".repeat(targetPosition - pos - 1)}:${rest}`;
            }
        } else if (isDottedMode && targetPosition - 1) {
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

type TimeRecord = Record<string, number>;

const createAliases = <const R extends TimeRecord, M extends Record<keyof R, string[]>, N extends TimeRecord>(
    base: R,
    modifiers: M,
    next?: N,
) => {
    const result = { ...base, ...(next ?? {}) } as TimeRecord;

    for (const [from, aliases] of Object.entries(modifiers)) {
        const value = base[from];

        for (const alias of aliases) {
            result[alias] = value;
        }
    }

    return result;
};

const TimeUnitsAliases = createAliases(
    TimeUnitsOrder,
    {
        s: ["seconds", "sec", "second", "secs"],
        m: ["minutes", "min", "minute", "mins"],
        h: ["hours", "hour", "hr", "hrs"],
        d: ["days", "day"],
        w: ["weeks", "week"],
    },
    {
        ms: TimeUnits.Millisecond,
    },
);

const stringToMsRegex = /([0-9]+(?:[0-9,.]+)?)[\s.,]*([a-zA-Z]+)/g;

const formatToMs = (date: string) => {
    let result = 0;

    const matches = date.matchAll(stringToMsRegex);

    for (const [, value, unit] of matches) {
        const unitValue = TimeUnitsAliases[unit.toLowerCase()];
        if (unitValue === undefined) continue;
        result += Number(value) * unitValue;
    }

    return result;
};

export function ms(from: string): number;
export function ms(from: number): string;
export function ms(from: string | number): string | number {
    if (typeof from === "string") return formatToMs(from);
    return TimeFormat.toHumanize(from);
}

export const TimeFormat = {
    /**
     * Convert milliseconds to a string format.
     * @example "1h 4s"
     */
    toHumanize: createMsFormater(),
    /**
     * Convert milliseconds to a string dotted format.
     * @example "1:00:04"
     */
    toDotted: createMsFormater(false),
    /**
     * Convert a string to milliseconds.
     * @example "1h => 3600000"
     */
    toMs: formatToMs,
    /**
     * Convert milliseconds to a string.and string to milliseconds.
     * @example "3600000 => 1h"
     * @example "1h => 3600000"
     */
    ms,
};
