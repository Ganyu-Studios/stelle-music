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
import type { PermissionNames } from "#stelle/types";
import { getFormattedOptions } from "#stelle/utils/functions/internal/options.js";
import { sendErrorReport } from "#stelle/utils/functions/internal/report.js";
import { getPermissionKeys } from "../utils.js";

/**
 *
 * The default error default handler.
 * @param {AnyContext} ctx The context of the command.
 * @param {unknown} error The error that was thrown.
 * @returns {Promise<void>} A promise... duh.
 */
export async function onRunError(ctx: AnyContext, error: unknown): Promise<void> {
    const { messages } = await ctx.locale();

    await sendErrorReport({ error, ctx });
    await ctx.errorReply(messages.events.commandError, { ephemeral: true, content: "" });
}

/**
 *
 * The default error handler for autocomplete.
 * @param {AutocompleteInteraction} interaction The interaction.
 * @param {unknown} error The error that was thrown.
 * @returns {Promise<void>} A promise... and a half.
 */
export async function onAutocompleteError(interaction: AutocompleteInteraction, error: unknown): Promise<void> {
    if (!interaction.guildId) return;

    const { messages } = interaction.client.t(await interaction.client.database.locales.get(interaction.guildId)).get();

    await sendErrorReport({ error });

    return interaction.respond([
        {
            name: messages.events.autocomplete.noAnything,
            value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
        },
    ]);
}

/**
 *
 * The default error handler for missing permissions.
 * @param {AnyContext} ctx The context of the command.
 * @param {PermissionStrings} permissions The permissions that the user is missing.
 * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half.
 */
export async function onPermissionsFail(
    ctx: AnyContext,
    permissions: PermissionStrings,
): Promise<MessageStructure | WebhookMessageStructure | void> {
    const { messages } = await ctx.locale();

    const keys: PermissionNames[] = getPermissionKeys(permissions);

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
                        value: keys.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                    },
                ],
            },
        ],
    });
}

/**
 *
 * The Stelle's default error handler for missing bot permissions.
 * @param {AnyContext} ctx The context of the command.
 * @param {PermissionStrings} permissions The permissions that the bot is missing.
 * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half too.
 */
export async function onBotPermissionsFail(
    ctx: AnyContext,
    permissions: PermissionStrings,
): Promise<MessageStructure | WebhookMessageStructure | void> {
    const { messages } = await ctx.locale();

    const keys: PermissionNames[] = getPermissionKeys(permissions);

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
                        value: keys.map((p): string => `- ${messages.events.permissions.list[p]}`).join("\n"),
                    },
                ],
            },
        ],
    });
}

/**
 *
 * The Stelle's default error handler for invalid options.
 * @param {AnyContext} ctx The context of the command.
 * @returns {Promise<MessageStructure | WebhookMessageStructure | void>} A promise... and a half maybe.
 */
export async function onOptionsError(ctx: AnyContext): Promise<MessageStructure | WebhookMessageStructure | void> {
    if (!ctx.isChat()) return;

    const { messages } = await ctx.locale();

    const command = ctx.command.toJSON();
    const options = getFormattedOptions(command.options, messages.events.optionTypes);

    const embed = new Embed()
        .setColor("Red")
        .setThumbnail(ctx.author.avatarURL())
        .setDescription(
            messages.events.invalidOptions({
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
}
