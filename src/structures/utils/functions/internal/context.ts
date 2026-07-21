import type { PlayerStructure } from "hoshimi";
import { type AnyContext, type DefaultLocale, extendContext, type UsingClient } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { type LocaleString, MessageFlags } from "seyfert/lib/types/index.js";

export const StelleContext = extendContext((i) => ({
    async locale(): Promise<DefaultLocale> {
        return i.client.t(await this.localeString()).get();
    },
    localeString(): Promise<LocaleString> {
        if (!i.guildId) return Promise.resolve((i.user.locale as LocaleString | undefined) ?? i.client.config.defaultLocale);
        return i.client.database.locales.get(i.guildId);
    },
    errorReply(this: AnyContext, description: string, options: QuickReplyOptions = {}): Promise<void> {
        return embedReply(this, description, EmbedColors.Red, options);
    },
    successReply(this: AnyContext, description: string, options: QuickReplyOptions = {}): Promise<void> {
        return embedReply(this, description, this.client.config.color.success, options);
    },
    getPlayer(this: AnyContext): PlayerStructure | undefined {
        if (!this.guildId) return undefined;
        return this.client.manager.getPlayer(this.guildId);
    },
}));

interface QuickReplyOptions {
    ephemeral?: boolean;
    content?: string;
}

function embedReply(ctx: AnyContext, description: string, color: number, options: QuickReplyOptions): Promise<void> {
    return ctx.editOrReply({
        ...(options.content !== undefined && { content: options.content }),
        ...(options.ephemeral && { flags: MessageFlags.Ephemeral }),
        embeds: [{ description, color }],
    });
}

export const ContextOps = {
    async locale(client: UsingClient, guildId: string): Promise<DefaultLocale> {
        return client.t(await client.database.locales.get(guildId)).get();
    },
};
