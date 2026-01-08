import type { LocaleString } from "seyfert/lib/types/index.js";
import { Controller } from "#stelle/classes/Controller.js";
import { CacheKeys } from "#stelle/types";

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
        const cached = this.cache.get(CacheKeys.Locale, guildId);
        if (cached?.locale) return cached.locale as LocaleString;

        const data = await this.model.findUnique({ where: { guildId } });
        if (!data?.locale) return this.client.config.defaultLocale;

        return data.locale as LocaleString;
    }

    /**
     *
     * Update the locale for a guild.
     * @param {string} guildId The guild id to update the locale for.
     * @param {string} locale The new locale to set for the guild.
     * @returns {Promise<void>} A promise that resolves when the locale is updated.
     */
    public async update(guildId: string, locale: string): Promise<void> {
        await this.model
            .upsert({
                where: { guildId },
                create: { guildId, locale },
                update: { locale },
            })
            .then((data) => this.cache.set(CacheKeys.Locale, data.guildId, data));
    }
}
