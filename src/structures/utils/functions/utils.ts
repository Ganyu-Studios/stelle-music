import { inspect } from "node:util";
import type { Player, RepeatMode } from "lavalink-client";

import { type AnyContext, type DefaultLocale, extendContext } from "seyfert";
import type { AutoplayMode, PausedMode } from "#stelle/types";

/**
 * Stelle custom context.
 */
export const customContext = extendContext((interaction) => ({
    /**
     *
     * Get the locale from the database.
     * @returns The locales object.
     */
    getLocale: async (): Promise<DefaultLocale> =>
        interaction.client.t(await interaction.client.database.getLocale(interaction.guildId!)).get(),
    /**
     *
     * Get the locale string from the database.
     * @returns The locale string.
     */
    getLocaleString: () => interaction.client.database.getLocale(interaction.guildId!),
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
export const createBar = (player: Player): string => {
    const size = 15;
    const line = "▬";
    const slider = "🔘";

    if (!player.queue.current) return `${slider}${line.repeat(size - 1)}`;

    const current = player.position;
    const total = player.queue.current.info.duration;

    const progress = Math.min(current / total, 1);
    const filledLength = Math.round(size * progress);
    const emptyLength = size - filledLength;

    return `${line.repeat(filledLength).slice(0, -1)}${slider}${line.repeat(emptyLength)}`;
};

/**
 *
 * Stelle loop state.
 * @param mode The mode.
 * @param alt Return the alternative state.
 * @returns
 */
export const getLoopState = (mode: RepeatMode, alt?: boolean) => {
    const states: Record<RepeatMode, RepeatMode> = {
        off: "track",
        track: "queue",
        queue: "off",
    };

    if (alt) {
        states.off = "off";
        states.track = "track";
        states.queue = "queue";
    }

    return states[mode];
};

/**
 *
 * Stelle autoplay state.
 * @param boolean The boolean.
 * @returns
 */
export const getAutoplayState = (boolean: boolean): AutoplayMode => (boolean ? "enabled" : "disabled");

/**
 *
 * Stelle pause state.
 * @param boolean The boolean.
 * @returns
 */
export const getPauseState = (boolean: boolean): PausedMode => (boolean ? "resume" : "pause");

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
