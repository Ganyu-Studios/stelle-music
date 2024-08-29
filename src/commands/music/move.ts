import { Command, type CommandContext, Declare, LocalesT, Options, createChannelOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

import { ChannelType } from "seyfert/lib/types/index.js";

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
@StelleOptions({ cooldown: 5, category: StelleCategory.Music, checkPlayer: true, inVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.move.name", "locales.move.description")
export default class MoveCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { voice, text } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        if (text) {
            player.options.textChannelId = text.id;
            player.textChannelId = text.id;
        }

        player.options.voiceChannelId = voice.id;
        player.voiceChannelId = voice.id;

        await player.connect();
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.move({
                        voiceId: voice.id,
                        textId: text?.id ?? ctx.channel()?.id ?? "1143606303850483280",
                    }),
                },
            ],
        });
    }
}
