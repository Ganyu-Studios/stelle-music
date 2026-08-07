import {
    type AllGuildVoiceChannels,
    Command,
    createChannelOption,
    Declare,
    type GuildCommandContext,
    type GuildMember,
    LocalesT,
    type MessageStructure,
    Middlewares,
    Options,
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import { ApplicationIntegrationType, ChannelType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";

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
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.join.name", "locales.join.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions", "checkBotVoiceChannel"])
export default class JoinCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { options, client, channelId, member } = ctx;

        if (!member) return;

        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const state: VoiceState | null = await member.voice().catch((): null => null);
        if (!state) return;

        const voice: AllGuildVoiceChannels | undefined = await state.channel();
        if (!voice) return;

        const { messages } = await ctx.locale();
        const { defaultVolume } = await client.database.players.get(ctx.guildId);

        const channel: AllGuildVoiceChannels = options.voice ?? voice;
        if (channel.guildId !== ctx.guildId) return ctx.errorReply(messages.events.noSameGuild, { content: "" });

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textId: channelId,
            voiceId: channel.id,
            volume: defaultVolume,
            selfDeaf: true,
        });

        await joinVoiceChannel(player, voice, me);

        await ctx.successReply(messages.commands.join({ channelId: channel.id }), { ephemeral: true, content: "" });
    }
}
