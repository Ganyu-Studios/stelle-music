import type { DefaultLocale, GuildMember, UsingClient } from "seyfert";
import { EmbedColors, type PermissionStrings } from "seyfert/lib/common/index.js";
import { PermissionsBitField } from "seyfert/lib/structures/extra/Permissions.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import type { PermissionNames } from "#stelle/types/index.js";

export const PermissionOps = {
    /**
     *
     * Return the permission names from the given permission strings.
     * @param {PermissionStrings} permissions The permission strings.
     * @returns {PermissionNames[]} The permission names.
     */
    names(permissions: PermissionStrings): PermissionNames[] {
        return new PermissionsBitField(permissions.map((p): bigint => PermissionsBitField.resolve(p))).keys();
    },
    /**
     *
     * Return the permissions the bot is missing in a channel (empty when it has them all).
     * @param {UsingClient} client The client instance.
     * @param {string} channelId The channel to check the bot's permissions in.
     * @param {GuildMember} me The bot's guild member.
     * @param {PermissionStrings} required The permissions the bot must have.
     * @returns {Promise<PermissionNames[]>} The names of the missing permissions.
     */
    async missing(client: UsingClient, channelId: string, me: GuildMember, required: PermissionStrings): Promise<PermissionNames[]> {
        const permissions: PermissionsBitField = await client.channels.memberPermissions(channelId, me);

        return PermissionOps.names(permissions.keys(permissions.missings(required)));
    },
    /**
     *
     * Build the "missing permissions" reply payload for a channel, to be sent by the caller.
     * @param {DefaultLocale["messages"]} messages The localized messages.
     * @param {string} channelId The channel the permissions are missing in.
     * @param {PermissionNames[]} missings The missing permission names.
     * @returns The message payload with the missing-permissions embed.
     */
    message(messages: DefaultLocale["messages"], channelId: string, missings: PermissionNames[]) {
        return {
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.permissions.embed.channel({ channelId }),
                    color: EmbedColors.Red,
                    fields: [
                        {
                            name: messages.events.permissions.embed.field,
                            value: missings.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                        },
                    ],
                },
            ],
        };
    },
};
