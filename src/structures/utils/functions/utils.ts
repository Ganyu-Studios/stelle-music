import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import { inspect as nodeInspect } from "node:util";
import type { Player } from "lavalink-client";
import {
    ActionRow,
    type AnyContext,
    type Button,
    type DefaultLocale,
    extendContext,
    type TopLevelComponents,
    User,
    type UsingClient,
} from "seyfert";
import { resolvePartialEmoji } from "seyfert/lib/common/index.js";
import { type APIMessageComponentEmoji, ButtonStyle, ComponentType, type LocaleString } from "seyfert/lib/types/index.js";
import type { EditButtonOptions, Omit, StelleUser } from "#stelle/types";
import { InvalidRow } from "#stelle/utils/errors.js";

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

interface CreateIdOptions {
    /**
     * The length of each segment.
     * @type {number}
     * @default 8
     */
    length?: number;
    /**
     * The number of segments.
     * @type {number}
     * @default 1
     */
    segments?: number;
    /**
     * The separator between segments.
     * @type {string}
     * @default "-"
     */
    separator?: string;
    /**
     * Whether to uppercase the ID.
     * @type {boolean}
     * @default false
     */
    uppercase?: boolean;
}

/**
 * The custom context is used to extend the context.
 * @returns {CustomContext} The custom context.
 */
export const StelleContext = extendContext((i) => ({
    /**
     * Get the locale from the context.
     * @returns {Promise<DefaultLocale>} The locale object.
     */
    async locale(): Promise<DefaultLocale> {
        return i.client.t(await this.localeString()).get();
    },
    /**
     * Get the locale string from the context.
     * @returns {Promise<LocaleString>} The locale string.
     */
    localeString(): Promise<LocaleString> {
        // funny thing, i can't return the locale directly, since this is not asynchronous
        // why just don't make the method asynchronous? the get function already returns a promise
        // so, the function is a promise itself, y'know?
        if (!i.guildId) return Promise.resolve((i.user.locale as LocaleString | undefined) ?? i.client.config.defaultLocale);
        return i.client.database.locales.get(i.guildId);
    },
}));

/**
 *
 * Check if the value is valid.
 * @param {unknown} value
 * @returns {boolean} True if the value is valid.
 */
export const isValid = (value: unknown): boolean => {
    return (
        value !== null &&
        value !== undefined &&
        (typeof value !== "string" || value.length > 0) &&
        (typeof value !== "object" || Object.keys(value).length > 0) &&
        (typeof value !== "number" || !Number.isNaN(Number(value))) &&
        (!Array.isArray(value) || value.length > 0)
    );
};

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
    if (requester instanceof User)
        return {
            ...omitKeys(requester, ["client"]),
            global_name: requester.username,
            tag: requester.bot ? requester.username : requester.tag,
        };

    return requester as StelleUser;
};

/**
 *
 * Edit a non-link or non-premium button rows with specific options.
 * @param {TopLevelComponents[]} rows The rows to edit.
 * @param {EditButtonOptions} options The options to edit the rows.
 * @returns {ActionRow<Button>[]} The edited rows.
 */
export const disableButtons = (rows: TopLevelComponents[], options?: Partial<EditButtonOptions>): ActionRow<Button>[] =>
    rows.map((builder): ActionRow<Button> => {
        const row = builder.toJSON();

        if (row.type !== ComponentType.ActionRow) throw new InvalidRow("Invalid row type, expected ActionRow.");

        return new ActionRow<Button>({
            components: row.components.map((component) => {
                if (component.type !== ComponentType.Button) return component;
                if (component.style === ButtonStyle.Link || component.style === ButtonStyle.Premium) return component;

                if (options?.disabled) component.disabled = options.disabled;

                if (options && component.custom_id === options.customId) {
                    options.style ??= component.style;

                    if (options.emoji) component.emoji = resolvePartialEmoji(options.emoji) as APIMessageComponentEmoji | undefined;

                    component.label = options.label;
                    component.style = options.style;
                }

                return component;
            }),
        });
    });

/**
 *
 * Create a new player progress bar.
 * @param {Player} player The player.
 * @returns {string} The player track bar.
 */
export const createPlayerBar = (player: Player): string => {
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
 * Create a directory if it doesn't exist.
 * @param {string} dirname The directory name to create.
 * @return {Promise<string>} The absolute path of the created directory.
 */
export const createDirectory = async (dirname: string): Promise<string> => {
    const dir: string = ((): string => {
        if (isAbsolute(dirname)) return dirname;
        return join(process.cwd(), dirname);
    })();

    const isExists = existsSync(dir);
    if (!isExists) await mkdir(dir, { recursive: true });

    return dir;
};

/**
 * Create a random ID with optional separators.
 * @param {CreateIdOptions} [options] The id creation options.
 * @returns {string} The formatted random id.
 */
export const createId = (options: CreateIdOptions = {}): string => {
    const { length = 8, segments = 1, separator = "-", uppercase = false } = options;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result: string = "";

    for (let i: number = 0; i < segments; i++) {
        for (let j: number = 0; j < length; j++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        if (i < segments - 1) {
            result += separator;
        }
    }

    return uppercase ? result.toUpperCase() : result;
};

/**
 *
 * Checks if the given input string is a valid URL.
 * @param {string} input The input string to check.
 * @returns {boolean} True if the input is a valid URL, false otherwise.
 */
export const checkUrl = (input: string): boolean => {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:com\/invite|gg))\/\S+/i,
        /^(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[\w]{2,}(?:\/\S*)?$/i,
    ];

    return patterns.some((pattern) => pattern.test(input));
};

/**
 * Cleanup function to gracefully shut down the client.
 * @param client {UsingClient} The client instance.
 * @returns {void} Aishite, aishite, motto, motto
 */
export function cleanup(client: UsingClient): void {
    client.logger.info("Shutting down the client...");

    client.database?.disconnect();
    client.gateway?.disconnectAll();

    process.exit(0);
}

/**
 *
 * Truncate text to a specified length, adding ellipsis if needed.
 * @param {string} text The text to truncate.
 * @param {number} length The maximum length.
 * @returns {string} The truncated text.
 */
export const truncate = (text: string, length: number = 240): string => (text.length > length ? `${text.slice(0, length - 3)}...` : text);

/**
 *
 * Inspect an object with configurable depth.
 * @param {any} object The object to inspect.
 * @param {number} depth The depth to inspect.
 * @returns {string} The inspected object.
 */
export const inspect = (object: any, depth: number = 0): string => nodeInspect(object, { depth });

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
 * Convert a string to snake_case.
 * @param {string} text The text to convert.
 * @param {boolean} [upper=false] Whether to convert to uppercase or not.
 * @returns {string} The converted text.
 */
export const convertToSnakeCase = (text: string, upper: boolean = false): string => {
    const result = text.replace(/([a-z])([A-Z])/g, "$1_$2");
    return upper ? result.toUpperCase() : result.toLowerCase();
};

/**
 *
 * Import a file dynamically.
 * @param {string} path The path to the file.
 * @returns {Promise<T>} The imported file.
 */
export const customImport = <T>(path: string): Promise<T> =>
    import(`${pathToFileURL(path)}?update=${Date.now()}`).then((x) => x.default ?? x) as Promise<T>;

/**
 *
 * Wait for a specified number of milliseconds.
 * @param {number} ms The milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 */
export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
