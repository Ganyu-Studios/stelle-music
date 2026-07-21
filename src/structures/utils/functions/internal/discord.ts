import { Embed, type UsingClient } from "seyfert";
import type { ColorResolvable, PermissionStrings } from "seyfert/lib/common/index.js";
import { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import type { PermissionNames, WebhookMetadata } from "#stelle/types";

/**
 *
 * Parse a Discord webhook URL and return its id and token.
 * @param {string} url The webhook URL to parse.
 * @returns {WebhookMetadata | null} The parsed webhook metadata, or null if the URL is invalid.
 */
export function parseDiscordWebhook(url: string): WebhookMetadata | null {
    const regex = /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/api(?:\/v\d{1,2})?\/webhooks\/(?<id>\d{17,19})\/(?<token>[\w-]{68})/i;

    const match: RegExpExecArray | null = regex.exec(url);
    if (!match?.groups) return null;

    return { id: match.groups.id, token: match.groups.token };
}

/**
 * The minimal shape `sendGuildLog` reads off a guild, so it accepts both the guildCreate and guildDelete payloads
 * without depending on their (differently-narrowed) structural types.
 */
interface GuildLogSource {
    id: string;
    name: string;
    memberCount?: number;
    fetchOwner(): Promise<{ displayName: string } | null>;
}

/**
 * Send a guild join/leave log embed to the configured guilds channel. The guildCreate and guildDelete events build the
 * same four-field embed and differ only in color, title and description.
 * @param {UsingClient} client The client instance.
 * @param {GuildLogSource} guild The guild that was added or removed.
 * @param {{ color: ColorResolvable; title: string; description: string }} options The embed accents.
 * @returns {Promise<void>} A promise that resolves once the log is written.
 */
export async function sendGuildLog(
    client: UsingClient,
    guild: GuildLogSource,
    options: { color: ColorResolvable; title: string; description: string },
): Promise<void> {
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
}

/**
 *
 * A utility function to get the permission keys from the permissions bitfield.
 * @param {PermissionStrings} permissions The permissions to get the keys from.
 * @returns {PermissionNames[]} The permission keys.
 */
export const getPermissionKeys = (permissions: PermissionStrings): PermissionNames[] =>
    new PermissionsBitField(permissions.map((p): bigint => PermissionsBitField.resolve(p))).keys();
