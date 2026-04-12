import type { TrackStructure } from "hoshimi";
import {
    type AllGuildVoiceChannels,
    createStringOption,
    Declare,
    type GuildCommandContext,
    type GuildMember,
    LocalesT,
    type MessageStructure,
    Middlewares,
    Options,
    SubCommand,
    type User,
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";
import { requesterFn } from "#stelle/utils/functions/utils.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        autocomplete,
        locales: {
            name: "locales.playlist.commands.load.option.name",
            description: "locales.playlist.commands.load.option.description",
        },
    }),
};

@Declare({
    name: "load",
    description: "Load a music playlist.",
})
@LocalesT("locales.playlist.commands.load.name", "locales.playlist.commands.load.description")
@Options(options)
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkVoicePermissions", "checkNodes"])
export default class LoadSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessageStructure | MessageStructure | void> {
        await ctx.deferReply();

        const { client, member, channelId } = ctx;
        const { id } = ctx.options;

        const { messages } = await ctx.locale();

        const playlist = await client.database.playlist.get(id, ctx.author.id);
        if (!playlist)
            return ctx.editOrReply({
                content: "",
                embeds: [
                    {
                        description: messages.commands.playlist.noPlaylist,
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (!playlist.tracks.length)
            return ctx.editOrReply({
                content: "",
                embeds: [
                    {
                        description: messages.commands.playlist.noTracks,
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (!member) return;

        const me: GuildMember | null = await ctx.me().catch((): null => null);
        if (!me) return;

        const state: VoiceState | null = await member.voice().catch((): null => null);
        if (!state) return;

        const voice: AllGuildVoiceChannels | undefined = await state.channel();
        if (!voice) return;

        const { defaultVolume } = await client.database.players.get(ctx.guildId);

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textId: channelId,
            voiceId: voice.id,
            volume: defaultVolume,
            selfMute: false,
            selfDeaf: true,
        });

        await joinVoiceChannel(player, voice, me);

        if (!(await player.data.get("localeString"))) await player.data.set("localeString", await ctx.localeString());
        if (!(await player.data.get("me"))) await player.data.set("me", requesterFn(client.me));

        const tracks: TrackStructure[] = await Promise.all(
            playlist.tracks.map(async (track): Promise<TrackStructure> => {
                const requester: User = await client.users.fetch(track.requesterId);
                return player.node.decode.single(track.encoded, requesterFn(requester));
            }),
        );

        await player.queue.add(tracks);

        if (!player.playing && !player.paused) await player.play();

        await ctx.editOrReply({
            content: "",
            embeds: [
                {
                    description: messages.commands.playlist.loaded({ name: playlist.playlistName }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
