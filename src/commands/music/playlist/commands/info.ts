import type { PlayerStructure, TrackStructure } from "hoshimi";
import {
    createStringOption,
    Declare,
    Embed,
    type Guild,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Options,
    SubCommand,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import type { TrackUser } from "#stelle/types";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { requesterFn } from "#stelle/utils/functions/utils.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

const options = {
    id: createStringOption({
        description: "The id of the playlist to load.",
        required: true,
        autocomplete,
        locales: {
            name: "locales.playlist.commands.info.option.name",
            description: "locales.playlist.commands.info.option.description",
        },
    }),
};

@Declare({
    name: "info",
    description: "Show information about a music playlist.",
})
@LocalesT("locales.playlist.commands.info.name", "locales.playlist.commands.info.description")
@Options(options)
export default class InfoSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessageStructure | MessageStructure | void> {
        if (!ctx.inGuild()) return;

        const { client } = ctx;
        const { messages } = await ctx.locale();

        const { id } = ctx.options;

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

        const guild: Guild<"cached" | "api"> = await ctx.guild();

        const player: PlayerStructure | undefined = client.manager.getPlayer(guild.id);
        if (!player)
            return ctx.editOrReply({
                content: "",
                embeds: [
                    {
                        description: messages.events.noPlayer,
                        color: EmbedColors.Red,
                    },
                ],
            });

        const limit = 20;
        const tracks: string[] = await player.node.decode
            .multiple(
                playlist.tracks.map((t): string => t.encoded),
                {} as TrackUser,
            )
            .then((decoded: TrackStructure[]): string[] =>
                decoded.map((track, i): string => {
                    const requester: TrackUser = requesterFn(playlist.tracks[i].requester);

                    return `#${i + 1}. [\`${track.info.title}\`](${track.info.uri}) - ${requester.tag}`;
                }),
            );

        if (tracks.length <= limit)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    new Embed()
                        .setDescription(messages.events.playerQueue({ tracks: tracks.slice(0, limit).join("\n") }))
                        .setColor(client.config.color.extra)
                        .setThumbnail(guild.iconURL())
                        .setTimestamp()
                        .setAuthor({ name: ctx.author.tag, iconUrl: ctx.author.avatarURL() }),
                ],
            });

        const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

        for (let i: number = 0; i < tracks.length; i += limit) {
            paginator.addEmbed(
                new Embed()
                    .setDescription(messages.events.playerQueue({ tracks: tracks.slice(i, i + limit).join("\n") }))
                    .setColor(client.config.color.extra)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp()
                    .setAuthor({ name: ctx.author.tag, iconUrl: ctx.author.avatarURL() }),
            );
        }

        await paginator.reply({ ephemeral: true });
    }
}
