import type { LocaleString } from "seyfert/lib/types/index.js";
import { Controller } from "#stelle/classes/Controller.js";

/**
 * Class representing the locale controller.
 * @class LocaleController
 * @extends Controller<"guildLocale">
 */
export class LocaleController extends Controller<"guildLocale"> {
    readonly modelName = "guildLocale";

    /**
     *
     * Get the locale for a guild.
     * @param {string} guildId The guild id to get the locale for.
     * @returns {Promise<LocaleString>} A promise that resolves to the locale string.
     */
    public async get(guildId: string): Promise<LocaleString> {
        const data = await this.cacheGet({
            read: () => this.database.cache.getGuild(guildId)?.locale,
            write: (record): void => {
                this.database.cache.guild(guildId).locale = record;
            },
            query: () => this.model.findUnique({ where: { guildId } }),
        });

        return (data?.locale ?? this.database.client.config.defaultLocale) as LocaleString;
    }

    /**
     *
     * Update the locale for a guild.
     * @param {string} guildId The guild id to update the locale for.
     * @param {string} locale The new locale to set for the guild.
     * @returns {Promise<void>} A promise that resolves when the locale is updated.
     */
    public update(guildId: string, locale: string): Promise<void> {
        return this.cacheSet({
            write: (record): void => {
                this.database.cache.guild(guildId).locale = record;
            },
            query: () => this.model.upsert({ where: { guildId }, create: { guildId, locale }, update: { locale } }),
        });
    }
}
