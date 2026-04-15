import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import { inspect as nodeInspect } from "node:util";
import type { TrackRequester, TrackStructure } from "hoshimi";
import {
    ActionRow,
    type AnyContext,
    type Button,
    Container,
    type DefaultLocale,
    extendContext,
    type MessageStructure,
    User,
    type UsingClient,
    type WebhookMessageStructure,
} from "seyfert";
import { type PermissionStrings, resolvePartialEmoji } from "seyfert/lib/common/index.js";
import { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import {
    type APIActionRowComponent,
    type APIActionRowComponentTypes,
    type APIButtonComponent,
    type APIContainerComponent,
    type APIContainerComponents,
    type APIMessageComponentEmoji,
    type APISectionComponent,
    type APITopLevelComponent,
    ButtonStyle,
    ComponentType,
    type LocaleString,
} from "seyfert/lib/types/index.js";
import type { EditButtonOptions, Omit, PermissionNames, Plain, Prettify, WebhookMetadata } from "#stelle/types";
import { InvalidRow } from "#stelle/utils/errors.js";
import { TimeFormat } from "./time.js";

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
 * Parse a Discord webhook URL and return its id and token.
 * @param {string} url The webhook URL to parse.
 * @returns {WebhookMetadata | null} The parsed webhook metadata, or null if the URL is invalid.
 */
export function parseDiscordWebhook(url: string): WebhookMetadata | null {
    const regex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(?<id>\d{17,19})\/(?<token>[\w-]{68})/i;

    const match: RegExpExecArray | null = regex.exec(url);
    if (!match?.groups) return null;

    return { id: match.groups.id, token: match.groups.token };
}

/**
 *
 * Transform the requester user into a simple object.
 * @param {unknown} requester The requester user.
 * @returns {StelleUser} The transformed user.
 */
export const requesterFn = <T extends TrackRequester = TrackRequester>(requester: TrackRequester): T => {
    if (requester instanceof User)
        return {
            ...omitKeys(requester as User & Record<string, unknown>, [
                "client",
                "avatarDecorationData",
                "banner",
                "createdAt",
                "discriminator",
                "flags",
                "publicFlags",
                "accentColor",
                "system",
                "verified",
                "email",
                "mfaEnabled",
                "primaryGuild",
                "premiumType",
                "locale",
                "name",
                "createdTimestamp",
                "globalName",
                "avatar",
                "displayNameStyles",
                "collectibles",
                "clan",
            ]),
            bot: requester.bot ?? false,
            tag: requester.bot ? requester.username : requester.tag,
        } as T;

    return requester as T;
};

/**
 *
 * Update buttons in a message, with optional overrides for specific buttons.
 * @param {MessageStructure | WebhookMessageStructure} message The message to edit the components of.
 * @param {EditButtonOptions} options The options to edit the rows.
 * @returns {ActionRow<Button>[]} The edited rows.
 */
export const updateComponents = (
    message: MessageStructure | WebhookMessageStructure,
    options?: Partial<EditButtonOptions>,
): Array<ActionRow<Button> | Container> =>
    message.components.map((builder): ActionRow<Button> | Container => {
        const topLevel: APITopLevelComponent = builder.toJSON() as APITopLevelComponent;

        const updateButton = (component: APIButtonComponent): APIButtonComponent => {
            if (component.style === ButtonStyle.Link || component.style === ButtonStyle.Premium) return component;

            if (options?.disabled) component.disabled = options.disabled;

            if (options && "custom_id" in component && component.custom_id === options.customId) {
                options.style ??= component.style;

                if (options.emoji) component.emoji = resolvePartialEmoji(options.emoji) as APIMessageComponentEmoji | undefined;

                component.label = options.label;
                component.style = options.style;
            }

            return component;
        };

        const updateButtons = (components: APIActionRowComponentTypes[]): APIActionRowComponentTypes[] =>
            components.map((component): APIActionRowComponentTypes => {
                if (component.type !== ComponentType.Button) return component;
                return updateButton(component);
            });

        if (topLevel.type === ComponentType.ActionRow) {
            const row: APIActionRowComponent<APIActionRowComponentTypes> = {
                ...topLevel,
                components: updateButtons(topLevel.components),
            };

            return new ActionRow<Button>(row);
        }

        if (topLevel.type === ComponentType.Container) {
            const container: APIContainerComponent = {
                ...topLevel,
                components: topLevel.components.map((nested): APIContainerComponents => {
                    if (nested.type === ComponentType.ActionRow) {
                        return {
                            ...nested,
                            components: updateButtons(nested.components),
                        };
                    }

                    if (nested.type === ComponentType.Section && nested.accessory?.type === ComponentType.Button) {
                        const section: APISectionComponent = {
                            ...nested,
                            accessory: updateButton(nested.accessory),
                        };

                        return section;
                    }

                    return nested;
                }),
            };

            return new Container(container);
        }

        throw new InvalidRow("Invalid component type, expected ActionRow or Container.");
    });

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

    const isExists: boolean = existsSync(dir);
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
 * Cleanup function to gracefully shut down the client.
 * @param client {UsingClient} The client instance.
 * @returns {void} Aishite, aishite, motto, motto
 */
export function cleanup(client: UsingClient): void {
    client.logger.info("[Client] Shutdown requested");

    client.database?.disconnect();
    client.gateway?.disconnectAll();

    process.exit(0);
}

/**
 *
 * A utility function to get the permission keys from the permissions bitfield.
 * @param {PermissionStrings} permissions The permissions to get the keys from.
 * @returns {PermissionNames[]} The permission keys.
 */
export const getPermissionKeys = (permissions: PermissionStrings): PermissionNames[] =>
    new PermissionsBitField(permissions.map((p): bigint => PermissionsBitField.resolve(p))).keys();

/**
 * Format the track time for display, showing "Live" for streams and a dotted time format for regular tracks.
 * @param {TrackStructure} track The track to format the time for.
 * @param {DefaultLocale} messages The locale object for localized messages.
 * @returns {string} The formatted time string.
 */
export const formatDuration = (track: TrackStructure, messages: DefaultLocale["messages"]): string =>
    track.info.isStream ? messages.commands.play.live : (TimeFormat.toDotted(track.info.length) ?? messages.commands.play.undetermined);

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
 * @param {unknown} object The object to inspect.
 * @param {number} depth The depth to inspect.
 * @returns {string} The inspected object.
 */
export const inspect = (object: unknown, depth: number = 0): string => nodeInspect(object, { depth });

/**
 *
 * Check if a string is a valid URL.
 * @param {string} input The string to check.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
export const isUrl = (input: string): boolean => /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/i.test(input);

/**
 *
 * Omit keys from an object and convert to plain object without functions.
 * @param {T} obj The object to omit keys.
 * @param {K[]} keys The keys to omit.
 * @returns {Plain<Omit<T, K>>} The object without the keys and without functions.
 */
export const omitKeys = <T extends object, K extends readonly (keyof T)[]>(obj: T, keys: K): Prettify<Plain<Omit<T, K[number]>>> =>
    Object.fromEntries(Object.entries(obj as Record<string, unknown>).filter(([key]) => !keys.includes(key as keyof T))) as Plain<
        Omit<T, K[number]>
    >;

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
export const wait = (ms: number): Promise<void> => new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));
