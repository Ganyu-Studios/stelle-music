import { Embed, type Guild, type UsingClient } from "seyfert";
import type { ColorResolvable, PermissionStrings } from "seyfert/lib/common/index.js";
import { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import type { PermissionNames, WebhookMetadata } from "#stelle/types";

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
    webhook(url: string): WebhookMetadata | null {
        const regex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(?<id>\d{17,19})\/(?<token>[\w-]{68})/i;

        const match: RegExpExecArray | null = regex.exec(url);
        if (!match?.groups) return null;

        return { id: match.groups.id, token: match.groups.token };
    },

    async guildLog(client: UsingClient, guild: Guild<"create"> | Guild<"cached">, options: GuildLogOptions): Promise<void> {
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

    permissions(permissions: PermissionStrings): PermissionNames[] {
        return new PermissionsBitField(permissions.map((p): bigint => PermissionsBitField.resolve(p))).keys();
    },
};
