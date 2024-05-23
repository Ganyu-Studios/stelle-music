import { createMiddleware } from "seyfert";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "discord-api-types/v10";

export const checkVerifications = createMiddleware<void>(async ({ context, next }) => {
    const { client, author, member, command } = context;
    const { developerIds } = client.config;
    const { messages } = context.t.get(await context.getLocale());
    
    if (!member) return;
    if (!command) return;

    const guild = context.guild();
    if (!guild) return;

    const voice = member.voice();
    const bot = context.me()?.voice();

    if (command.onlyDeveloper && !developerIds.includes(author.id))
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.onlyDeveloper,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.onlyGuildOwner && author.id !== guild.ownerId)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.onlyDeveloper,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.inVoice && !voice)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.sameVoice && bot && bot.channelId !== voice?.channelId)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

    return next();
})