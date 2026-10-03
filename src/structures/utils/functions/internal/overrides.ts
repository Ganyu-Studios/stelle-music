import {
    type AnyContext,
    type AutocompleteInteraction,
    Embed,
    type MessageStructure,
    type PermissionStrings,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import type { PermissionNames } from "#stelle/types/index.js";
import { ContextOps } from "#stelle/utils/functions/internal/context.js";
import { getFormattedOptions } from "#stelle/utils/functions/internal/options.js";
import { PermissionOps } from "#stelle/utils/functions/internal/permissions.js";
import { sendErrorReport } from "#stelle/utils/functions/internal/report.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * Builds the "missing permissions" embed reply shared by the user- and bot-permission handlers.
 * @param {AnyContext} ctx The context of the command.
 * @param {PermissionStrings} permissions The permissions that are missing.
 * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} The reply.
 */
async function permissionsFail(
    ctx: AnyContext,
    permissions: PermissionStrings,
): Promise<MessageStructure | WebhookMessageStructure | void> {
    const { messages } = await ctx.locale();

    const missings: PermissionNames[] = PermissionOps.names(permissions);

    return ctx.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                description: messages.events.permissions.embed.description,
                color: EmbedColors.Red,
                fields: [
                    {
                        name: messages.events.permissions.embed.field,
                        value: missings.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                    },
                ],
            },
        ],
    });
}

/**
 * Stelle's default command-handler overrides: the error, permission and invalid-option hooks wired
 * into the client's command handler.
 */
export const OverridesOps = {
    /**
     *
     * The default error default handler.
     * @param {AnyContext} ctx The context of the command.
     * @param {unknown} error The error that was thrown.
     * @returns {Promise<void>} A promise... duh.
     */
    async runError(ctx: AnyContext, error: unknown): Promise<void> {
        const { messages } = await ctx.locale();

        await sendErrorReport({ error, ctx });
        await ctx.errorReply(messages.events.commandError, { ephemeral: true, content: "" });
    },

    /**
     *
     * The default error handler for autocomplete.
     * @param {AutocompleteInteraction} interaction The interaction.
     * @param {unknown} error The error that was thrown.
     * @returns {Promise<void>} A promise... and a half.
     */
    async autocompleteError(interaction: AutocompleteInteraction, error: unknown): Promise<void> {
        if (!interaction.guildId) return;

        const { messages } = await ContextOps.locale(interaction.client, interaction.guildId);

        await sendErrorReport({ error });
        await interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.no.anything));
    },

    /**
     *
     * The default error handler for missing permissions.
     * @param {AnyContext} ctx The context of the command.
     * @param {PermissionStrings} permissions The permissions that the user is missing.
     * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half.
     */
    permissions(ctx: AnyContext, permissions: PermissionStrings): Promise<MessageStructure | WebhookMessageStructure | void> {
        return permissionsFail(ctx, permissions);
    },

    /**
     *
     * The Stelle's default error handler for missing bot permissions.
     * @param {AnyContext} ctx The context of the command.
     * @param {PermissionStrings} permissions The permissions that the bot is missing.
     * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half too.
     */
    botPermissions(ctx: AnyContext, permissions: PermissionStrings): Promise<MessageStructure | WebhookMessageStructure | void> {
        return permissionsFail(ctx, permissions);
    },

    /**
     *
     * The Stelle's default error handler for invalid options.
     * @param {AnyContext} ctx The context of the command.
     * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half maybe.
     */
    async options(ctx: AnyContext): Promise<MessageStructure | WebhookMessageStructure | void> {
        if (!ctx.isChat()) return;

        const { messages } = await ctx.locale();

        const command = ctx.command.toJSON();
        const options = getFormattedOptions(command.options, messages.events.optionTypes);

        const embed = new Embed()
            .setColor("Red")
            .setThumbnail(ctx.author.avatarURL())
            .setDescription(
                messages.events.invalid.options({
                    options: Formatter.codeBlock(options.map(({ option }) => option).join(" "), "js"),
                    list: options
                        .map(({ option, description, range }): string =>
                            `* \`${option}\` ${range ? `\`[${range}]\`` : ""}: ${description}`.trim(),
                        )
                        .join("\n"),
                }),
            )
            .setTimestamp();

        return ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [embed],
        });
    },
} as const;
