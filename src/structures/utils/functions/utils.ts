import { join } from "node:path";
import { inspect } from "node:util";
import { extendContext } from "seyfert";

import { magicImport } from "seyfert/lib/common/index.js";

import humanize from "humanize-duration";

/**
 * Stelle custom context.
 */
export const customContext = extendContext((interaction) => ({
    /**
     *
     * Get the locale from the database.
     * @returns
     */
    getLocale: async () => interaction.client.t(await interaction.client.database.getLocale(interaction.guildId!)).get(),
}));

/**
 *
 * Stelle custom runtime configuration.
 * @returns
 */
export const stelleRC = async (): Promise<any> => {
    const { locations, debug, ...env } = await magicImport(join(process.cwd(), "seyfert.config.js")).then((x) => x.default ?? x);
    return {
        ...env,
        debug: !!debug,
        templates: locations.templates ? join(process.cwd(), locations.base, locations.templates) : undefined,
        langs: locations.langs ? join(process.cwd(), locations.output, locations.langs) : undefined,
        events: locations.events ? join(process.cwd(), locations.output, locations.events) : undefined,
        components: locations.components ? join(process.cwd(), locations.output, locations.components) : undefined,
        commands: locations.commands ? join(process.cwd(), locations.output, locations.commands) : undefined,
        lavalink: join(process.cwd(), locations.output, locations.lavalink),
    };
};

/**
 *
 * Convert MS to a time string.
 * @param time
 * @returns
 */
export const parseTime = (time?: number): string | undefined => {
    if (!time) return;

    const humanizer = humanize.humanizer({
        spacer: "",
        language: "short",
        maxDecimalPoints: 0,
        serialComma: false,
        delimiter: ":",
        languages: {
            short: {
                y: () => "",
                mo: () => "",
                w: () => "",
                d: () => "",
                h: () => "",
                m: () => "",
                s: () => "",
                ms: () => "",
            },
        },
    });

    return humanizer(time);
};

/**
 *
 * Convert MS to a time string.
 * @param time
 * @returns
 */
export const msParser = (time?: number): string => {
    if (!time) return "0s";

    const humanizer = humanize.humanizer({
        spacer: "",
        language: "short",
        maxDecimalPoints: 0,
        serialComma: false,
        delimiter: " ",
        languages: {
            short: {
                y: () => "y",
                mo: () => "mo",
                w: () => "w",
                d: () => "d",
                h: () => "h",
                m: () => "m",
                s: () => "s",
                ms: () => "ms",
            },
        },
    });

    return humanizer(time);
};

/**
 *
 * Check a flag in the process command.
 * @param flag
 * @returns
 */
export const getFlag = (flag: string) => process.argv.some((arg) => arg === flag);

/**
 *
 * Convert a number color to HEX.
 * @param color - The color number
 * @returns
 */
export const convertToHEX = (color?: number) => (color ? `#${color.toString(16).padStart(6, "0")}` : "#FFFFFF");

/**
 *
 * Representation of a object.
 * @param error
 * @returns
 */
export const getDepth = (error: any): string => inspect(error, { depth: 0 });

/**
 *
 * Create a new codeblock.
 * @param language
 * @param code
 * @returns
 */
export const codeBlock = (language: string, code: string) => `\`\`\`${language}\n${code}\n\`\`\``;

/**
 *
 * Slice text.
 * @param text
 * @returns
 */
export const sliceText = (text: string, max: number = 100) => (text.length > max ? `${text.slice(0, max)}...` : text);
