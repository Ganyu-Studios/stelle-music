import type { Track } from "lavalink-client";
import {
    createStringOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Middlewares,
    Options,
    SubCommand,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { playlistAutocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { omitKeys, requesterTransformer } from "#stelle/utils/functions/utils.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        autocomplete: playlistAutocomplete,
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
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessage | Message | void> {
        await ctx.deferReply();

        const { client, member, channelId } = ctx;
        const { id } = ctx.options;

        const { messages } = await ctx.locale();

        const playlist = await client.database.playlist.get(id);
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

        const me = await ctx.me();
        if (!me) return;

        const state = await member.voice().catch(() => null);
        if (!state) return;

        const voice = await state.channel();
        if (!voice) return;

        const { defaultVolume } = await client.database.players.get(ctx.guildId);

        const player = client.manager.createPlayer({
            guildId: ctx.guildId,
            textChannelId: channelId,
            voiceChannelId: voice.id,
            volume: defaultVolume,
            selfMute: false,
            selfDeaf: true,
        });

        if (!player.connected) await player.connect();

        let bot = await me.voice().catch(() => null);
        if (!bot) bot = await me.voice().catch(() => null);

        if (bot && bot.channelId !== voice.id) return;
        if (voice.isStage() && bot?.suppress) await bot.setSuppress(false);

        if (!player.get("localeString")) player.set("localeString", await ctx.localeString());
        if (!player.get("me")) player.set("me", omitKeys(client.me, ["client"]));

        const tracks: Track[] = await Promise.all(
            playlist.tracks.map(async (track) => {
                const requester = await client.users.fetch(track.requesterId);
                return player.node.decode.singleTrack(track.encoded, requesterTransformer(requester));
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
