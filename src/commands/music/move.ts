import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares, Options, createChannelOption } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { ChannelType } from "seyfert/lib/types/index.js";

const options = {
    voice: createChannelOption({
        description: "Select the voice channel.",
        channel_types: [ChannelType.GuildVoice],
        required: true,
        locales: {
            name: "locales.move.options.voice.name",
            description: "locales.move.options.voice.description",
        },
    }),
    text: createChannelOption({
        description: "Select the text channel.",
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
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.move.name", "locales.move.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class MoveCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { voice, text } = options;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        if (text) {
            player.options.textChannelId = text.id;
            player.textChannelId = text.id;
        }

        player.options.voiceChannelId = voice.id;
        player.voiceChannelId = voice.id;

        const textId = text?.id ?? player.textChannelId ?? player.options.textChannelId ?? ctx.channelId;

        await player.connect();
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.move({
                        textId,
                        voiceId: voice.id,
                    }),
                },
            ],
        });
    }
}
