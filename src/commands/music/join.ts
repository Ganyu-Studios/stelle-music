import {
    Command,
    createChannelOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    Options,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { ChannelType, MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

const options = {
    voice: createChannelOption({
        description: "Select the voice channel.",
        channel_types: [ChannelType.GuildVoice],
        required: false,
        locales: {
            name: "locales.move.options.voice.name",
            description: "locales.move.options.voice.description",
        },
    }),
};

@Declare({
    name: "join",
    description: "Join a voice channel.",
    aliases: ["connect"],
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.join.name", "locales.join.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
export default class JoinCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { options, client, channelId, member } = ctx;

        if (!member) return;

        const me = await ctx.me();
        if (!me) return;

        const state = await member.voice().catch(() => null);
        if (!state) return;

        const voice = await state.channel();
        if (!voice) return;

        const { messages } = await ctx.locale();
        const { defaultVolume } = await client.database.players.get(ctx.guildId);

        const channel = options.voice ?? voice;
        if (channel.guildId !== ctx.guildId)
            return ctx.editOrReply({
                content: "",
                embeds: [
                    {
                        description: messages.events.noSameGuild,
                        color: EmbedColors.Red,
                    },
                ],
            });

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textChannelId: channelId,
            voiceChannelId: channel.id,
            volume: defaultVolume,
            selfDeaf: true,
        });

        if (!player.connected) await player.connect();

        let bot = await me.voice().catch(() => null);
        if (!bot) bot = await me.voice().catch(() => null);
        if (voice.isStage() && bot?.suppress) await bot.setSuppress(false);

        await ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.join({ channelId: channel.id }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
