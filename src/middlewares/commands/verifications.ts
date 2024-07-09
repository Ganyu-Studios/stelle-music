import { createMiddleware } from "seyfert";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

export const checkVerifications = createMiddleware<void>(async ({ context, next }) => {
    const { client, author, member, command } = context;
    const { developerIds } = client.config;

    const guild = context.guild();

    if (!(member && command && guild)) return;

    const { messages } = await context.getLocale();

    const voice = member.voice();
    const bot = context.me()?.voice();
    const player = client.manager.getPlayer(context.guildId);
    const isAutoplay = player?.data.get("enabledAutoplay") as boolean | undefined;

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
                    description: messages.events.onlyGuildOwner,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.checkNodes && !client.manager.isUseable)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noNodes,
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

    if (command.sameVoice && bot && bot.channelId !== voice!.channelId)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.checkPlayer && !player)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noPlayer,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.checkQueue && (!isAutoplay ?? false) && player!.queue.isEmpty)
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

    if (command.moreTracks && !(player!.queue.totalSize >= 2))
        return context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.moreTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

    return next();
});
