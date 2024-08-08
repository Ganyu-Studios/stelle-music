import { createMiddleware } from "seyfert";

import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

export const checkVerifications = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, author, member, command } = context;
    const { developerIds } = client.config;

    const guild = context.guild();

    if (!(member && command && guild)) return pass();

    const { messages } = await context.getLocale();

    const voice = await (await member.voice())?.channel().catch(() => null);
    const bot = await context.me()?.voice().catch(() => null);
    const player = client.manager.getPlayer(guild.id);
    const isAutoplay = !!player?.get<boolean | undefined>("enabledAutoplay");

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

    if (command.onlyGuildOwner && author.id !== guild.ownerId) {
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

    if (command.checkNodes && !client.manager.useable) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noNodes,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (command.inVoice && !voice?.is(["GuildVoice", "GuildStageVoice"])) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noVoiceChannel,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (command.sameVoice && bot && bot.channelId !== voice!.id) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noSameVoice({ channelId: bot.channelId! }),
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (command.checkPlayer && !player) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noPlayer,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (command.checkQueue && !isAutoplay && !player!.queue.tracks.length) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    if (command.moreTracks && !(player!.queue.tracks.length + Number(!!player.queue.current) >= 1)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.moreTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});
