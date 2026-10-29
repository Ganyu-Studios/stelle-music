import { Embed, type Guild, type UsingClient } from "seyfert";
import type { ColorResolvable } from "seyfert/lib/common/index.js";
import type { WebhookMetadata } from "#stelle/types/index.js";

/**
 * The interface for the guild log options.
 */
interface GuildLogOptions {
    /**
     * The color of the embed.
     * @type {ColorResolvable}
     */
    color: ColorResolvable;
    /**
     * The title of the embed.
     * @type {string}
     */
    title: string;
    /**
     * The description of the embed.
     * @type {string}
     */
    description: string;
}

export const DiscordOps = {
    /**
     *
     * Return the webhook metadata from a Discord webhook URL.
     * @param {string} url The Discord webhook URL.
     * @returns {WebhookMetadata | null} The webhook metadata or null if the URL is invalid.
     */
    webhook(url: string): WebhookMetadata | null {
        const regex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(?<id>\d{17,19})\/(?<token>[\w-]{68})/i;

        const match: RegExpExecArray | null = regex.exec(url);
        if (!match?.groups) return null;

        return { id: match.groups.id, token: match.groups.token };
    },
    /**
     *
     * Log a guild event to the specified channel using an embed.
     * @param {UsingClient} client The client instance.
     * @param {Guild<"create" | "cached">} guild The guild to log.
     * @param {GuildLogOptions} options The options for the log.
     * @returns {Promise<void>} A promise that resolves when the log is sent.
     */
    async guildLog(client: UsingClient, guild: Guild<"create" | "cached">, options: GuildLogOptions): Promise<void> {
        const owner = await guild.fetchOwner().catch((): null => null);
        const ownerName: string = owner?.displayName ?? "Unknown";

        const embed = new Embed()
            .setColor(options.color)
            .setTitle(options.title)
            .setDescription(options.description)
            .addFields(
                { name: "`📜` Name", value: `\`${guild.name}\``, inline: true },
                { name: "`👤` Owner", value: `\`${ownerName}\``, inline: true },
                { name: "`🏮` ID", value: `\`${guild.id}\``, inline: true },
                { name: "`👥` Members", value: `\`${guild.memberCount}\``, inline: true },
            );

        await client.messages.write(client.config.channels.guildsId, { embeds: [embed] });
    },
};
