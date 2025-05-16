import { ActionRow, type AnyContext, type Button, type DefaultLocale, type TopLevelComponents, User, extendContext } from "seyfert";

import type { Player } from "lavalink-client";
import { resolvePartialEmoji } from "seyfert/lib/common/index.js";
import { type APIMessageComponentEmoji, ButtonStyle, ComponentType, type LocaleString } from "seyfert/lib/types/index.js";

import type { EditButtonOptions, Omit, StelleUser } from "#stelle/types";
import { InvalidRow } from "#stelle/utils/errors.js";

import { inspect } from "node:util";

/**
 * The webhook object is used to parse the webhook url.
 */
interface WebhookObject {
    /**
     * The id of the webhook.
     * @type {string}
     */
    id: string;
    /**
     * The token of the webhook.
     * @type {string}
     */
    token: string;
}

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
 * @param {T} obj The object to omit keys.
 * @param {K[]} keys The keys to omit.
 * @returns {Omit<T, K>} The object without the keys.
 */
export const omitKeys = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> =>
    Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;

/**
 *
 * Check if the value is valid.
 * @param {unknown} value
 * @returns {boolean} True if the value is valid.
 */
export const isValid = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;

    if (typeof value === "string" && !value.length) return false;
    if (typeof value === "object" && !Object.keys(value).length) return false;
    if (typeof value === "number" && Number.isNaN(Number(value))) return false;

    if (Array.isArray(value) && !value.length) return false;

    return true;
};

/**
 * Convert a string to snake_case.
 * @param {string} text The text to convert.
 * @returns {string} The converted text.
 */
export const convertToSnakeCase = (text: string): string => text.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

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

/**
 *
 * Parses a webhook url.
 * @param {string} url The webhook url.
 * @returns {WebhookObject | null} The parsed webhook.
 */
export const parseWebhook = (url: string): WebhookObject | null => {
    const webhookRegex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,19})\/([\w-]{68})/i;
    const match = webhookRegex.exec(url);

    return match ? { id: match[1], token: match[2] } : null;
};

/**
 *
 * Transform the requester user into a simple object.
 * @param {unknown} requester The requester user.
 * @returns {StelleUser} The transformed user.
 */
export const requesterTransformer = (requester: unknown): StelleUser => {
    if (requester instanceof User) {
        const user = omitKeys(requester, ["client"]);

        return {
            ...user,
            global_name: requester.username,
            tag: requester.bot ? requester.username : requester.tag,
        };
    }

    return requester as StelleUser;
};

/**
 *
 * Edit a non-link or non-premium button rows with specific options.
 * @param {TopLevelComponents[]} rows The rows to edit.
 * @param {EditButtonOptions} options The options to edit the rows.
 * @returns {ActionRow<Button>[]} The edited rows.
 */
export const editButtonComponents = (rows: TopLevelComponents[], options: EditButtonOptions): ActionRow<Button>[] =>
    rows.map((builder): ActionRow<Button> => {
        const row = builder.toJSON();

        if (row.type !== ComponentType.ActionRow) throw new InvalidRow("Invalid row type, expected ActionRow.");

        return new ActionRow<Button>({
            components: row.components.map((component) => {
                if (component.type !== ComponentType.Button) return component;
                if (component.style === ButtonStyle.Link || component.style === ButtonStyle.Premium) return component;

                if (component.custom_id === options.customId) {
                    options.style ??= component.style;

                    if (options.emoji) component.emoji = resolvePartialEmoji(options.emoji) as APIMessageComponentEmoji;

                    component.label = options.label;
                    component.style = options.style;
                }

                return component;
            }),
        });
    });

/**
 *
 * Create a new progress bar.
 * @param {Player} player The player.
 * @returns {string} The progress bar.
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
