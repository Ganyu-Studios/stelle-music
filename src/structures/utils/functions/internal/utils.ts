import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import { inspect as nodeInspect } from "node:util";
import type { AnyContext, UsingClient } from "seyfert";
import type { Omit, Plain, Prettify } from "#stelle/types";

interface CreateIdOptions {
    length?: number;
    segments?: number;
    separator?: string;
    uppercase?: boolean;
}

export const UtilsOps = {
    collectionKey(ctx: AnyContext): string {
        const authorId: string = ctx.author.id;

        if (ctx.isChat() || ctx.isMenu() || ctx.isEntryPoint()) return `${authorId}-${ctx.fullCommandName}-command`;
        if (ctx.isComponent() || ctx.isModal()) return `${authorId}-${ctx.customId}-component`;

        return `${authorId}-all`;
    },

    async createDir(dirname: string): Promise<string> {
        const dir: string = ((): string => {
            if (isAbsolute(dirname)) return dirname;
            return join(process.cwd(), dirname);
        })();

        const isExists: boolean = existsSync(dir);
        if (!isExists) await mkdir(dir, { recursive: true });

        return dir;
    },

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

    chunk<T>(items: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(items.length / size) }, (_, i): T[] => items.slice(i * size, i * size + size));
    },

    cleanup(client: UsingClient): void {
        client.logger.info("[Client] Shutdown requested");

        client.database?.disconnect();
        client.gateway?.disconnectAll();

        process.exit(0);
    },

    truncate(text: string, length: number = 240): string {
        return text.length > length ? `${text.slice(0, length - 3)}...` : text;
    },

    inspect(object: unknown, depth: number = 0): string {
        return nodeInspect(object, { depth });
    },

    isUrl(input: string): boolean {
        return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/i.test(input);
    },

    omit<T extends object, K extends readonly (keyof T)[]>(obj: T, keys: K): Prettify<Plain<Omit<T, K[number]>>> {
        return Object.fromEntries(
            Object.entries(obj as Record<string, unknown>).filter(([key]) => !keys.includes(key as keyof T)),
        ) as Plain<Omit<T, K[number]>>;
    },

    dynamicImport<T>(path: string): Promise<T> {
        return import(`${pathToFileURL(path)}?update=${Date.now()}`).then((x) => x.default ?? x) as Promise<T>;
    },

    wait(ms: number): Promise<void> {
        return new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));
    },

    hasFlags(flags: number = 0, check: number[]): boolean {
        return check.every((flag) => (flags & flag) === flag);
    },
};
