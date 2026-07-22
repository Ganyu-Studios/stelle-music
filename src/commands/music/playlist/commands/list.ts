import {
    createUserOption,
    Declare,
    Embed,
    type GuildCommandContext,
    type InteractionGuildMember,
    LocalesT,
    type MessageStructure,
    Options,
    SubCommand,
    type User,
    type WebhookMessageStructure,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { EmbedPaginator } from "#stelle/classes/EmbedPaginator.js";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

const options = {
    user: createUserOption({
        description: "The user to display public playlists from.",
        required: false,
        locales: {
            name: "locales.playlist.commands.list.option.name",
            description: "locales.playlist.commands.list.option.description",
        },
    }),
};

@Declare({
    name: "list",
    description: "Display available playlists.",
})
@LocalesT("locales.playlist.commands.list.name", "locales.playlist.commands.list.description")
@Options(options)
export default class ListSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, author } = ctx;
        const { messages } = await ctx.locale();

        const target: InteractionGuildMember | User | undefined = ctx.options.user;
        const isSelf: boolean = !!target && target.id === author.id;
        const isApplicable: boolean = !target || isSelf;

        const playlists = (
            await client.database.playlist.all((playlist): boolean => {
                if (isApplicable) return playlist.userId === author.id || playlist.public;
                return playlist.userId === target?.id && playlist.public;
            })
        ).sort((a, b): number => Number(b.public) - Number(a.public) || b.createdAt.getTime() - a.createdAt.getTime());

        if (!playlists.length) return ctx.errorReply(messages.commands.playlist.noPlaylist, { ephemeral: true, content: "" });

        const limit: number = 20;
        const privatePlaylists = playlists.filter((playlist): boolean => isApplicable && playlist.userId === author.id && !playlist.public);
        const publicPlaylists = playlists.filter((playlist): boolean => playlist.public);

        const timestamp = (date: Date): number => Math.floor(date.getTime() / 1e3);

        const formatPrivatePlaylist = (playlist: (typeof privatePlaylists)[number]): string =>
            messages.commands.playlist.list.privateEntry({
                id: playlist.playlistId,
                name: UtilsOps.truncate(playlist.playlistName, 28),
                tracks: playlist.tracks.length,
                timestamp: timestamp(playlist.createdAt),
            });

        const formatPublicPlaylist = (playlist: (typeof publicPlaylists)[number]): string =>
            messages.commands.playlist.list.publicEntry({
                id: playlist.playlistId,
                name: UtilsOps.truncate(playlist.playlistName, 28),
                tracks: playlist.tracks.length,
                userId: playlist.userId,
                timestamp: timestamp(playlist.createdAt),
            });

        const privatePages: string[][] = UtilsOps.chunk(privatePlaylists.map(formatPrivatePlaylist), limit);
        const publicPages: string[][] = UtilsOps.chunk(publicPlaylists.map(formatPublicPlaylist), limit);
        const length: number = Math.max(privatePages.length, publicPages.length);

        const embeds: Embed[] = Array.from({ length }, (_, page: number): Embed => {
            const sections: string[] = [];

            if (isApplicable) {
                const privatePage: string[] = privatePages[page] ?? [];
                if (privatePage.length)
                    sections.push(`### ${messages.commands.playlist.list.private} (${privatePlaylists.length})`, privatePage.join("\n"));
            }

            const publicPage: string[] = publicPages[page] ?? [];
            if (publicPage.length)
                sections.push(`### ${messages.commands.playlist.list.public} (${publicPlaylists.length})`, publicPage.join("\n"));

            return new Embed()
                .setTitle(messages.commands.playlist.list.available)
                .setColor(client.config.color.extra)
                .setDescription(sections.join("\n\n"));
        });

        if (!embeds.length || embeds.length === 1)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [embeds[0]],
            });

        const paginator: EmbedPaginator = new EmbedPaginator({ ctx, embeds });

        await paginator.reply({ ephemeral: true });
    }
}
