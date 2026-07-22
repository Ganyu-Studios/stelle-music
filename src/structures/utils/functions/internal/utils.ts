import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import { inspect as nodeInspect } from "node:util";
import type { AnyContext, UsingClient } from "seyfert";
import type { Omit, Plain, Prettify } from "#stelle/types";

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

export const UtilsOps = {
    /**
     *
     * Return the cooldown collection key.
     * @param {AnyContext} ctx The context.
     * @returns {string} The collection key.
     */
    collectionKey(ctx: AnyContext): string {
        const authorId: string = ctx.author.id;

        if (ctx.isChat() || ctx.isMenu() || ctx.isEntryPoint()) return `${authorId}-${ctx.fullCommandName}-command`;
        if (ctx.isComponent() || ctx.isModal()) return `${authorId}-${ctx.customId}-component`;

        return `${authorId}-all`;
    },
    /**
     *
     * Create a directory if it doesn't exist.
     * @param {string} dirname The directory name to create.
     * @return {Promise<string>} The absolute path of the created directory.
     */
    async createDir(dirname: string): Promise<string> {
        const dir: string = ((): string => {
            if (isAbsolute(dirname)) return dirname;
            return join(process.cwd(), dirname);
        })();

        const isExists: boolean = existsSync(dir);
        if (!isExists) await mkdir(dir, { recursive: true });

        return dir;
    },
    /**
     * Create a random ID with optional separators.
     * @param {CreateIdOptions} [options] The id creation options.
     * @returns {string} The formatted random id.
     */
    createId(options: CreateIdOptions = {}): string {
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
    },
    /**
     *
     * Split an array into chunks of a specified size.
     * @param {T[]} items The array of items to split into chunks.
     * @param {number} size The size of each chunk.
     * @returns {T[][]} An array of chunks, where each chunk is an array of items.
     */
    chunk<T>(items: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(items.length / size) }, (_, i): T[] => items.slice(i * size, i * size + size));
    },
    /**
     * Cleanup function to gracefully shut down the client.
     * @param client {UsingClient} The client instance.
     * @returns {void} Aishite, aishite, motto, motto
     */
    cleanup(client: UsingClient): void {
        client.logger.info("[Client] Shutdown requested");

        client.database?.disconnect();
        client.gateway?.disconnectAll();

        process.exit(0);
    },
    /**
     *
     * Truncate text to a specified length, adding ellipsis if needed.
     * @param {string} text The text to truncate.
     * @param {number} length The maximum length.
     * @returns {string} The truncated text.
     */
    truncate(text: string, length: number = 240): string {
        return text.length > length ? `${text.slice(0, length - 3)}...` : text;
    },
    /**
     *
     * Inspect an object with configurable depth.
     * @param {unknown} object The object to inspect.
     * @param {number} depth The depth to inspect.
     * @returns {string} The inspected object.
     */
    inspect(object: unknown, depth: number = 0): string {
        return nodeInspect(object, { depth });
    },
    /**
     *
     * Check if a string is a valid URL.
     * @param {string} input The string to check.
     * @returns {boolean} True if the string is a valid URL, false otherwise.
     */
    isUrl(input: string): boolean {
        return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/i.test(input);
    },
    /**
     *
     * Omit keys from an object and convert to plain object without functions.
     * @param {T} obj The object to omit keys.
     * @param {K[]} keys The keys to omit.
     * @returns {Plain<Omit<T, K>>} The object without the keys and without functions.
     */
    omit<T extends object, K extends readonly (keyof T)[]>(obj: T, keys: K): Prettify<Plain<Omit<T, K[number]>>> {
        return Object.fromEntries(
            Object.entries(obj as Record<string, unknown>).filter(([key]) => !keys.includes(key as keyof T)),
        ) as Plain<Omit<T, K[number]>>;
    },
    /**
     *
     * Import a file dynamically.
     * @param {string} path The path to the file.
     * @returns {Promise<T>} The imported file.
     */
    dynamicImport<T>(path: string): Promise<T> {
        return import(`${pathToFileURL(path)}?update=${Date.now()}`).then((x) => x.default ?? x) as Promise<T>;
    },
    /**
     *
     * Wait for a specified number of milliseconds.
     * @param {number} ms The milliseconds to wait.
     * @returns {Promise<void>} A promise that resolves after the specified time.
     */
    wait(ms: number): Promise<void> {
        return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));
    },
    /**
     *
     * Check if the flags include the check flags.
     * @param {number} flags The flags to check.
     * @param {number} check The flags to check for.
     * @returns {boolean} True if the flags include the checkFlags.
     */
    hasFlags(flags: number = 0, check: number[]): boolean {
        return check.every((flag) => (flags & flag) === flag);
    },
};
