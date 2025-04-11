import { type AnyContext, type DefaultLocale, extendContext } from "seyfert";
import type { LocaleString } from "seyfert/lib/types/index.js";
import type { Omit } from "#stelle/types";

import { inspect } from "node:util";

/**
 *
 * Slice the text.
 * @param {string} text The text to slice.
 * @param {number} length The length to slice.
 * @returns {string} The sliced text.
 */
export const sliceText = (text: string, length: number = 240): string => (text.length > length ? `${text.slice(0, length - 3)}...` : text);

/**
 *
 * Get the inspected object.
 * @param {any} object The object to inspect.
 * @param {number} depth The depth to inspect.
 * @returns {string} The inspected object.
 */
export const getInspect = (object: any, depth: number = 0): string => inspect(object, { depth });

/**
 *
 * Omit keys from an object.
 * @param obj The object to omit keys.
 * @param keys The keys to omit.
 * @returns {Omit<T, K>} The object without the keys.
 */
export const omitKeys = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> =>
    Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;

/**
 * The custom context is used to extend the context.
 * @returns {CustomContext} The custom context.
 */
export const StelleContext = extendContext((i) => ({
    /**
     * Get the locale from the context.
     * @returns {Promise<DefaultLocale>} The locale object.
     */
    async getLocale(): Promise<DefaultLocale> {
        return i.client.t(await this.getLocaleString()).get();
    },
    /**
     * Get the locale string from the context.
     * @returns {Promise<LocaleString>} The locale string.
     */
    getLocaleString(): Promise<LocaleString> {
        // funny thing, i can't return the locale directly, since this is not asyncronous
        if (!i.guildId) return Promise.resolve((i.user.locale as LocaleString | undefined) ?? i.client.config.defaultLocale);
        return i.client.database.getLocale(i.guildId);
    },
}));

/**
 *
 * Return the cooldown collection key.
 * @param {AnyContext} ctx The context.
 * @returns {string} The collection key.
 */
export const getCollectionKey = (ctx: AnyContext): string => {
    // for some reason, ctx is never, so, the author doesn't exists.
    // save the user id before calling the context typeguards.
    const authorId: string = ctx.author.id;

    if (ctx.isChat() || ctx.isMenu() || ctx.isEntryPoint()) return `${authorId}-${ctx.fullCommandName}-command`;
    if (ctx.isComponent() || ctx.isModal()) return `${authorId}-${ctx.customId}-component`;

    return `${authorId}-all`;
};
