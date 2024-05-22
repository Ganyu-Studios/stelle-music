import { join } from "node:path";
import { inspect } from "node:util";
import { extendContext } from "seyfert";

import { magicImport } from "seyfert/lib/common/index.js";

/**
 * Stelle custom context.
 */
export const customContext = extendContext((int) => ({
    /**
     *
     * Get the locale from the database.
     * @returns
     */
    getLocale: async () => await int.client.database.getLocale(int.guildId!),
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
 * Slice text.
 * @param text
 * @returns
 */
export const sliceText = (text: string, max: number = 100) => (text.length > max ? `${text.slice(0, max)}...` : text);
