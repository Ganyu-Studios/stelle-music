import { createMiddleware } from "seyfert";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

export const checkMusic = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, member, command } = context;

    const guild = context.guild();

    if (!(member && command && guild)) return;

    const { messages } = await context.getLocale();

    const player = client.manager.getPlayer(context.guildId!);
    const isAutoplay = !!player?.get<boolean | undefined>("enabledAutoplay");

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

    if (command.moreTracks && !(player!.queue.tracks.length + Number(!!player.queue.current) >= 2)) {
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
