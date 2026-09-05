import { join } from "node:path";
import { z } from "zod";
import type { InternalStelleConfiguration, StelleConfiguration } from "#stelle/types";
import { InvalidConfiguration } from "#stelle/utils/errors.js";
import { UtilsOps } from "../functions/internal/utils.js";

const envSchema = z.object({
    TOKEN: z.string(),
    DATABASE_URL: z.string(),
    ERRORS_WEBHOOK: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_PASSWORD: z.string(),
    REDIS_USERNAME: z.string().default("default"),
    REDIS_SECURE: z.coerce.boolean().default(true),
});

/**
 * The environment variables schema.
 * @type {z.infer<typeof envSchema>}
 */
export type StelleEnvironment = z.infer<typeof envSchema>;

/**
 * The flag to check if the configuration is initialized.
 * @type {boolean}
 */
let isInitialized: boolean = false;

/**
 * The configuration of the bot.
 * @type {StelleConfiguration}
 */
//@ts-expect-error The configuration is dynamically loaded.
export const Configuration: StelleConfiguration = {
    async load(): Promise<void> {
        if (isInitialized) return;

        // *cries in cocogoat*
        const { BaseClient } = await import("seyfert/lib/client/base.js");

        const directory: string = await BaseClient.prototype.getRC().then((i): string => i.locations.config);
        const filenames: string[] = ["local.config", "default.config"];
        const extensions: string[] = [".ts", ".js"];

        for (const filename of filenames) {
            for (const ext of extensions) {
                const file: string = join(directory, `${filename}${ext}`);

                const i: StelleConfiguration | null = await UtilsOps.dynamicImport<StelleConfiguration>(file).catch((error) => {
                    if (error.stack.includes("ERR_MODULE_NOT_FOUND")) return null;
                    throw error;
                });

                if (!i || (typeof i === "object" && !Object.keys(i).length)) continue;

                Object.assign(this, i);
                isInitialized = true;
                return;
            }
        }

        throw new InvalidConfiguration(`No config file found in '/config/' with any of the filenames: \n- ${filenames.join("\n- ")}`);
    },
    async reload(): Promise<void> {
        if (!isInitialized) return;

        isInitialized = false;

        await this.load();
    },
};

/**
 * Creates a new configuration object.
 * @param {InternalStelleConfiguration} data The configuration data.
 * @returns {InternalStelleConfiguration} The new configuration object.
 */
export const createConfig = (data: InternalStelleConfiguration): InternalStelleConfiguration => data;

/**
 * The environment variables.
 * @type {StelleEnvironment}
 */
export const Environment: StelleEnvironment = envSchema
    .catch(({ issues }): never => {
        const message: string = issues
            .map(
                (issue): string =>
                    `❌ Stelle [${issue.path?.join(".") ?? "UNKNOWN"}]: Invalid input: expected ${issue.expected}, received ${issue.received}`,
            )
            .join("\n");

        console.info(message);

        throw new Error("Invalid environment variables.");
    })
    .parse(process.env);
