import { Embed, type PermissionStrings } from "seyfert";
import type { AnyContext } from "#stelle/types";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

import { formatOptions } from "./formatter.js";
import { codeBlock } from "./utils.js";

export async function onRunError(ctx: AnyContext, error: unknown) {
    const { messages } = await ctx.getLocale();

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

export async function onPermissionsFail(ctx: AnyContext, permissions: PermissionStrings) {
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
                        value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n- "),
                    },
                ],
            },
        ],
    });
}

export async function onBotPermissionsFail(ctx: AnyContext, permissions: PermissionStrings) {
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
                        value: permissions.map((p) => `- ${messages.events.permissions.list[p]}`).join("\n- "),
                    },
                ],
            },
        ],
    });
}

export async function onOptionsError(ctx: AnyContext) {
    if (!ctx.isChat()) return;

    const { messages } = await ctx.getLocale();

    const command = ctx.command.toJSON();
    const options = formatOptions(command.options, messages.events.optionTypes);

    const embed = new Embed()
        .setColor("Red")
        .setThumbnail(ctx.author.avatarURL())
        .setDescription(
            messages.events.invalidOptions({
                options: codeBlock("js", `${options.map(({ option }) => option).join(" ")}`),
                list: options.map(({ option, description, range }) => `* \`${option}\` \`[${range || "---"}]\`: ${description}`).join("\n"),
            }),
        )
        .setTimestamp();

    return ctx.editOrReply({
        content: "",
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
    });
}
