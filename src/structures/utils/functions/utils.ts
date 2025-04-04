import { inspect } from "node:util";
import { type AnyContext, type DefaultLocale, extendContext } from "seyfert";
import type { LocaleString } from "seyfert/lib/types/index.js";

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
 * The custom context is used to extend the context.
 * @returns {CustomContext} The custom context.
 */
export const StelleContext = extendContext((i) => ({
    async getLocale(): Promise<DefaultLocale> {
        return i.client.t(await this.getLocaleString()).get();
    },
    getLocaleString(): Promise<LocaleString> {
        if (!i.guildId) return Promise.resolve((i.user.locale as LocaleString | undefined) ?? i.client.config.defaultLocale);
        return Promise.resolve("en-US");
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
