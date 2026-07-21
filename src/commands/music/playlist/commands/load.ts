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
    type VoiceState,
    type WebhookMessageStructure,
} from "seyfert";
import type { TrackUser } from "#stelle/types";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { requesterFn } from "#stelle/utils/functions/internal/track.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";

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

        const playlist = await client.database.playlist.getLoadable(id, ctx.author.id);
        if (!playlist) return ctx.errorReply(messages.commands.playlist.noPlaylist, { content: "" });

        if (!playlist.tracks.length) return ctx.errorReply(messages.commands.playlist.noTracks, { content: "" });

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

        const tracks: TrackStructure[] = await player.node.decode
            .multiple(
                playlist.tracks.map((t): string => t.encoded),
                {} as TrackUser,
            )
            .then((decoded: TrackStructure[]): TrackStructure[] =>
                decoded.map((track, i): TrackStructure => {
                    track.requester = requesterFn(playlist.tracks[i].requester);
                    return track;
                }),
            );

        await player.queue.add(tracks);

        if (!player.playing && !player.paused) await player.play();

        await ctx.successReply(messages.commands.playlist.loaded({ name: playlist.playlistName }), { content: "" });
    }
}
