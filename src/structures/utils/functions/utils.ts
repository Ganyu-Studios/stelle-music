import { join } from "node:path";
import { extendContext } from "seyfert";
import { pathToFileURL } from "node:url";

import type { InternalStelleRuntime } from "#stelle/types";


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
export const stelleRC = async (): Promise<InternalStelleRuntime> => {
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
 * Convert a number color to HEX
 * @param color - The color number
 * @returns
 */
export const convertToHEX = (color?: number) => (color ? `#${color.toString(16).padStart(6, "0")}` : "#FFFFFF");

/**
 * 
 * Import files, that's all.
 * @param file 
 * @returns 
 */
export const magicImport = async (file: string) => await import(`${pathToFileURL(file)}?updated=${Date.now()}`);