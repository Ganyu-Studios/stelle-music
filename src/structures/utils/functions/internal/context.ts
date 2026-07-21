import type { PlayerStructure } from "hoshimi";
import { type AnyContext, type DefaultLocale, extendContext, type UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { type LocaleString, MessageFlags } from "seyfert/lib/types/index.js";

/**
 * Resolve a guild's locale object from the database, deduping the
 * `client.t(await client.database.locales.get(guildId)).get()` dance repeated by the code paths that resolve a locale
 * outside a command context (where `ctx.locale()` isn't available).
 * @param {UsingClient} client The client instance.
 * @param {string} guildId The guild id.
 * @returns {Promise<DefaultLocale>} The resolved locale object.
 */
export async function resolveLocale(client: UsingClient, guildId: string): Promise<DefaultLocale> {
    return client.t(await client.database.locales.get(guildId)).get();
}

/**
 * The options for the quick reply helpers (`errorReply` / `successReply`).
 */
interface QuickReplyOptions {
    /**
     * Whether the reply should be ephemeral.
     * @type {boolean}
     * @default false
     */
    ephemeral?: boolean;
    /**
     * The message content to set alongside the embed (e.g. `""` to clear a previous deferred content).
     * @type {string}
     */
    content?: string;
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
    /**
     * Reply with a simple error embed (red colored).
     * @param {string} description The embed description.
     * @param {QuickReplyOptions} [options] Optional reply options.
     * @returns {Promise<void>} A promise that resolves when the reply is sent.
     */
    errorReply(this: AnyContext, description: string, options: QuickReplyOptions = {}): Promise<void> {
        // Extensions are `Object.assign`ed onto the context, so `this` is the real context
        // (which always has `editOrReply`), unlike `i` which may be a raw `Message` for prefix commands.
        return this.editOrReply({
            ...(options.content !== undefined && { content: options.content }),
            ...(options.ephemeral && { flags: MessageFlags.Ephemeral }),
            embeds: [{ description, color: EmbedColors.Red }],
        });
    },
    /**
     * Reply with a simple success embed (using the configured success color).
     * @param {string} description The embed description.
     * @param {QuickReplyOptions} [options] Optional reply options.
     * @returns {Promise<void>} A promise that resolves when the reply is sent.
     */
    successReply(this: AnyContext, description: string, options: QuickReplyOptions = {}): Promise<void> {
        return this.editOrReply({
            ...(options.content !== undefined && { content: options.content }),
            ...(options.ephemeral && { flags: MessageFlags.Ephemeral }),
            embeds: [{ description, color: this.client.config.color.success }],
        });
    },
    /**
     * Get the lavalink player of the current guild, if any.
     * @returns {PlayerStructure | undefined} The guild player, or `undefined` if there is none.
     */
    getPlayer(this: AnyContext): PlayerStructure | undefined {
        if (!this.guildId) return undefined;
        return this.client.manager.getPlayer(this.guildId);
    },
}));
