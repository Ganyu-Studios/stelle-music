import { inspect } from "node:util";
import type { Player } from "lavalink-client";

import { type AnyContext, type DefaultLocale, extendContext } from "seyfert";

/**
 * Stelle custom context.
 */
export const customContext = extendContext((interaction) => ({
    /**
     *
     * Get the locale from the database.
     * @returns
     */
    getLocale: async (): Promise<DefaultLocale> =>
        interaction.client.t(await interaction.client.database.getLocale(interaction.guildId!)).get(),
}));

/**
 *
 * Create and Get the cooldown collection key.
 * @param ctx The context.
 * @returns
 */
export const getCollectionKey = (ctx: AnyContext): string => {
    const authorId = ctx.author.id;

    if (ctx.isChat() || ctx.isMenu()) return `${authorId}-${ctx.fullCommandName}-command`;
    if (ctx.isComponent() || ctx.isModal()) return `${authorId}-${ctx.customId}-component`;

    return `${authorId}-all`;
};

/**
 *
 * Create a new progress bar.
 * @param player The player.
 * @returns
 */
export const createBar = (player: Player) => {
    const size = 15;
    const line = "▬";
    const slider = "🔘";

    if (!player.queue.current) return `${slider}${line.repeat(size - 1)}]`;

    const current = player.queue.current.info.duration !== 0 ? player.position : player.queue.current.info.duration;
    const total = player.queue.current.info.duration;

    const bar =
        current > total
            ? [line.repeat((size / 2) * 2), (current / total) * 100]
            : [
                  line.repeat(Math.round((size / 2) * (current / total))).replace(/.$/, slider) +
                      line.repeat(size - Math.round(size * (current / total)) + 1),

                  current / total,
              ];

    if (!String(bar).includes(slider)) return `${slider}${line.repeat(size - 1)}`;

    return `${bar[0]}`;
};

/**
 *
 * Check a flag in the process command.
 * @param flag The flag.
 * @returns
 */
export const getFlag = (flag: string) => process.argv.includes(flag);

/**
 *
 * Representation of a object.
 * @param error The error.
 * @returns
 */
export const getDepth = (error: any, depth: number = 0): string => inspect(error, { depth });

/**
 *
 * Slice text.
 * @param text The text.
 * @returns
 */
export const sliceText = (text: string, max: number = 100) => (text.length > max ? `${text.slice(0, max)}...` : text);
