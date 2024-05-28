import { Command, type CommandContext, Embed, type PermissionStrings } from "seyfert";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

import { formatOptions } from "#stelle/utils/functions/formatter.js";
import { codeBlock } from "#stelle/utils/functions/utils.js";

/**
 * Main Stelle custom commands class.
 */
export class StelleCommand extends Command {
    async onRunError(ctx: CommandContext, error: Error) {
        const { messages } = ctx.t.get(await ctx.getLocale());

        ctx.client.logger.error(error);

        return ctx.editOrReply({
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

    async onPermissionsFail(ctx: CommandContext, permissions: PermissionStrings) {
        const { messages } = ctx.t.get(await ctx.getLocale());

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
                            value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n- "),
                        },
                    ],
                },
            ],
        });
    }

    async onBotPermissionsFail(ctx: CommandContext, permissions: PermissionStrings) {
        const { messages } = ctx.t.get(await ctx.getLocale());

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
                            value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n- "),
                        },
                    ],
                },
            ],
        });
    }
    async onOptionsError(ctx: CommandContext) {
        const { messages } = ctx.t.get(await ctx.getLocale());

        const command = ctx.command.toJSON();
        const options = formatOptions(command.options, messages.events.optionTypes);

        const embed = new Embed()
            .setColor("Red")
            .setThumbnail(ctx.author.avatarURL())
            .setDescription(
                messages.events.invalidOptions({
                    options: codeBlock("js", `${options.map(({ option }) => option).join(" ")}`),
                    list: options.map(({ option, description }) => `* \`${option}\`: ${description}`).join("\n"),
                }),
            )
            .setTimestamp();

        return ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [embed],
        });
    }
}
