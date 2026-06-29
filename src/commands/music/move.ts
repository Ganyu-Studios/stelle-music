import type { PlayerStructure } from "hoshimi";
import { Command, createChannelOption, Declare, type GuildCommandContext, LocalesT, Middlewares, Options } from "seyfert";
import { ApplicationIntegrationType, ChannelType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

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
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
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

        const { messages } = await ctx.locale();

        const player: PlayerStructure | undefined = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        if (text) {
            player.options.textId = text.id;
            player.textId = text.id;
        }

        player.options.voiceId = voice.id;
        player.voiceId = voice.id;

        const textId: string = text?.id ?? player.textId ?? player.options.textId ?? ctx.channelId;
        
        await player.setVoice({ voiceId: voice.id })
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
