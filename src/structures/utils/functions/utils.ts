import { extendContext } from "seyfert";

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
 * Check a flag in the process command.
 * @param flag
 * @returns
 */
export const getFlag = (flag: string) => process.argv.some((arg) => arg === flag);
