import { type AnyContext, type AutocompleteInteraction, Embed, type Message, type PermissionStrings, type WebhookMessage } from "seyfert";

import { getFormattedOptions } from "#stelle/utils/functions/options.js";
import { sendErrorReport } from "#stelle/utils/functions/report.js";

import { EmbedColors, Formatter } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

/**
 *
 * The default error default handler.
 * @param {AnyContext} ctx The context of the command.
 * @param {unknown} error The error that was thrown.
 * @returns {Promise<void>} A promise... duh.
 */
export async function onRunError(ctx: AnyContext, error: unknown): Promise<void> {
    const { messages } = await ctx.getLocale();

    await sendErrorReport({ error, ctx });
    await ctx.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                description: messages.events.commandError,
                color: EmbedColors.Red,
            },
        ],
    });
}

/**
 *
 * The default error handler for autocomplete.
 * @param interaction The interaction.
 * @param error The error that was thrown.
 * @returns {Promise<void>} A promise... and a half.
 */
export async function onAutocompleteError(interaction: AutocompleteInteraction, error: unknown): Promise<void> {
    if (!interaction.guildId) return;

    const { messages } = interaction.client.t(await interaction.client.database.getLocale(interaction.guildId)).get();

    await sendErrorReport({ error });

    return interaction.respond([
        {
            name: messages.commands.play.autocomplete.noAnything,
            value: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
        },
    ]);
}

/**
 *
 * The default error handler for missing permissions.
 * @param ctx The context of the command.
 * @param permissions The permissions that the user is missing.
 * @returns {Promise<void>} A promise... and a half.
 */
export async function onPermissionsFail(ctx: AnyContext, permissions: PermissionStrings): Promise<Message | WebhookMessage | void> {
    const { messages } = await ctx.getLocale();

    return ctx.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                description: messages.events.permissions.user.description,
                color: EmbedColors.Red,
                fields: [
                    {
                        name: messages.events.permissions.user.field,
                        value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n"),
                    },
                ],
            },
        ],
    });
}

/**
 *
 * The Stelle's default error handler for missing bot permissions.
 * @param ctx The context of the command.
 * @param permissions The permissions that the bot is missing.
 * @returns {Promise<void>} A promise... and a half too.
 */
export async function onBotPermissionsFail(ctx: AnyContext, permissions: PermissionStrings): Promise<Message | WebhookMessage | void> {
    const { messages } = await ctx.getLocale();

    return ctx.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [
            {
                description: messages.events.permissions.bot.description,
                color: EmbedColors.Red,
                fields: [
                    {
                        name: messages.events.permissions.bot.field,
                        value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n"),
                    },
                ],
            },
        ],
    });
}

/**
 *
 * The Stelle's default error handler for invalid options.
 * @param ctx The context of the command.
 * @returns {Promise<void>} A promise... and a half maybe.
 */
export async function onOptionsError(ctx: AnyContext): Promise<Message | WebhookMessage | void> {
    if (!ctx.isChat()) return;

    const { messages } = await ctx.getLocale();

    const command = ctx.command.toJSON();
    const options = getFormattedOptions(command.options, messages.events.optionTypes);

    const embed = new Embed()
        .setColor("Red")
        .setThumbnail(ctx.author.avatarURL())
        .setDescription(
            messages.events.invalidOptions({
                options: Formatter.codeBlock(options.map(({ option }) => option).join(" "), "js"),
                list: options
                    .map(({ option, description, range }) => `* \`${option}\` ${range ? `\`[${range}]\`` : ""}: ${description}`.trim())
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
