import { createMiddleware } from "seyfert";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

export const checkVerifications = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, author, command } = context;
    const { developerIds } = client.config;

    const { messages } = await context.getLocale();

    if (command.onlyDeveloper && !developerIds.includes(author.id)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.onlyDeveloper,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (context.inGuild()) {
        const guild = await context.guild();
        const member = context.member;

        if (command.onlyGuildOwner && member.id !== guild.ownerId) {
            await context.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.events.onlyGuildOwner,
                        color: EmbedColors.Red,
                    },
                ],
            });

            return pass();
        }

        return next();
    }

    return next();
});
