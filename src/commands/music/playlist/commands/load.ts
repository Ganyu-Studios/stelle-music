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
    type User,
    type WebhookMessage,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { omitKeys, requesterTransformer } from "#stelle/utils/functions/utils.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        locales: {
            name: "locales.playlist.commands.load.option.name",
            description: "locales.playlist.commands.load.option.description",
        },
        async autocomplete(interaction) {
            const { client, user } = interaction;

            if (!interaction.guildId) return;

            const { messages } = client.t(await client.database.locales.get(interaction.guildId)).get();

            const data = await client.database.playlist.all();
            if (!data || !data.length)
                return interaction.respond([
                    {
                        name: messages.events.autocomplete.noPlaylist,
                        value: "no-playlists-found",
                    },
                ]);

            /**
             *
             * Get the visibility of the playlist.
             * @param {boolean} isPublic True if the playlist is public, false otherwise.
             * @returns {string} The visibility of the playlist.
             */
            const getPlaylistVisibility = (isPublic: boolean): string => {
                const type = isPublic ? "public" : "private";
                return messages.commands.playlist.state[type];
            };

            const playlists = await Promise.all(
                data
                    .filter((playlist) => playlist.userId === user.id || playlist.public)
                    .sort((a, b) => (a.public === b.public ? 0 : a.public ? -1 : 1))
                    .map(async (playlist) => {
                        const author: User = await client.users.fetch(playlist.userId);
                        return {
                            value: playlist.playlistId,
                            name: messages.events.autocomplete.loadPlaylist({
                                name: playlist.playlistName,
                                visibility: getPlaylistVisibility(playlist.public),
                                author: author.tag,
                            }),
                        };
                    })
                    .slice(0, 25),
            );

            if (!playlists.length) {
                return interaction.respond([
                    {
                        name: messages.events.autocomplete.noPlaylist,
                        value: "no-playlists-found",
                    },
                ]);
            }

            return interaction.respond(playlists);
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

        const { messages } = await ctx.locale();

        const id = ctx.options.id;
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
                    description: messages.commands.playlist.load({ id: playlist.playlistId }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
