import { createMiddleware } from "seyfert";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

import type { AnyContext } from "#stelle/types";

type CommandData = {
    name: string;
    type: string;
};

function getMetadata(ctx: AnyContext): CommandData {
    if (ctx.isChat() || ctx.isMenu())
        return {
            name: ctx.fullCommandName,
            type: "command",
        };

    if (ctx.isComponent() || ctx.isModal())
        return {
            name: ctx.customId,
            type: "component",
        };

    return {
        name: "---",
        type: "any",
    };
}

export const checkCooldown = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, author, command } = context;
    const { cooldowns } = client;

    if (!command) return;

    const { name, type } = getMetadata(context);

    const cooldown = (command.cooldown ?? 3) * 1000;
    const timeNow = Date.now();
    const setKey = `${name}-${type}-${author.id}`;

    const { messages } = await context.getLocale();

    const data = cooldowns.get(setKey);
    if (data && timeNow < data) {
        context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.inCooldown({ time: Math.floor(data / 1000) }),
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    cooldowns.set(setKey, timeNow + cooldown, cooldown);

    return next();
});
