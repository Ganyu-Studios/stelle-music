import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { createMiddleware } from "seyfert";

export const checkVerifications = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, author, member, command } = context;
    const { developerIds } = client.config;

    const guild = await context.guild();

    if (!(member && guild)) {
        pass(); return;
    }

    const { messages } = await context.getLocale();

    if (command.onlyDeveloper && !developerIds.includes(author.id)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.onlyDeveloper,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    if (command.onlyGuildOwner && member.id !== guild.ownerId) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.onlyGuildOwner,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    next();
});
