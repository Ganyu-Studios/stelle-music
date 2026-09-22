import type { PlayerStructure } from "hoshimi";
import { type AnyContext, type DefaultLocale, extendContext, type UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { type LocaleString, MessageFlags } from "seyfert/lib/types/index.js";

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
 *
 * Reply with a simple embed with the given description and color.
 * @param {AnyContext} ctx The context to reply in.
 * @param {string} description The embed description.
 * @param {number} color The embed color.
 * @param {QuickReplyOptions} options The reply options.
 * @returns {Promise<void>} A promise that resolves when the reply is sent.
 */
function embedReply(ctx: AnyContext, description: string, color: number, options: QuickReplyOptions): Promise<void> {
    return ctx.editOrReply({
        ...(options.content !== undefined && { content: options.content }),
        ...(options.ephemeral && { flags: MessageFlags.Ephemeral }),
        embeds: [{ description, color }],
    });
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
        return embedReply(this, description, EmbedColors.Red, options);
    },
    /**
     * Reply with a simple success embed (using the configured success color).
     * @param {string} description The embed description.
     * @param {QuickReplyOptions} [options] Optional reply options.
     * @returns {Promise<void>} A promise that resolves when the reply is sent.
     */
    successReply(this: AnyContext, description: string, options: QuickReplyOptions = {}): Promise<void> {
        return embedReply(this, description, this.client.config.color.success, options);
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

export const ContextOps = {
    /**
     *
     * Get the locale from the client and guild id.
     * @param {UsingClient} client The client instance.
     * @param {string} guildId The guild id.
     * @returns {Promise<DefaultLocale>} The locale object.
     */
    async locale(client: UsingClient, guildId: string): Promise<DefaultLocale> {
        return client.t(await client.database.locales.get(guildId)).get();
    },
};
