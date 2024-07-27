import { createMiddleware } from "seyfert";

import { MessageFlags } from "discord-api-types/v10";
import { EmbedColors } from "seyfert/lib/common/index.js";

export const checkVoice = createMiddleware<void>(async ({ context, next, pass }) => {
    const { client, member, command } = context;

    const guild = context.guild();

    if (!(member && command && guild)) return;

    const { messages } = await context.getLocale();

    const voice = await member.voice()?.channel();
    const bot = context.me()?.voice();
    const player = client.manager.getPlayer(context.guildId!);

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

    return next();
});
