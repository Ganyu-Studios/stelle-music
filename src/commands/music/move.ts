import { Command, type CommandContext, Declare, LocalesT, Options, createChannelOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { ChannelType } from "discord-api-types/v10";

const options = {
    voice: createChannelOption({
        description: "Select the channel.",
        channel_types: [ChannelType.GuildVoice],
        required: true,
        locales: {
            name: "locales.move.options.voice.name",
            description: "locales.move.options.voice.description",
        },
    }),
    text: createChannelOption({
        description: "Select the channel.",
        channel_types: [ChannelType.GuildText],
        locales: {
            name: "locales.move.options.text.name",
            description: "locales.move.options.text.description",
        },
    }),
};

@Declare({
    name: "move",
    description: "Move the player.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["mov", "m"],
})
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.move.name", "locales.move.description")
export default class MoveCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { voice, text } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        if (text) player.setTextChannel(text.id);

        player.setVoiceChannel(voice.id);

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.move({
                        voiceId: voice.id,
                        textId: text?.toString() ?? "---",
                    }),
                },
            ],
        });
    }
}
