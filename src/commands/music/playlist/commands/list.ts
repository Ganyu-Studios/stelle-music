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
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { chunk, truncate } from "#stelle/utils/functions/utils.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

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

        if (!playlists.length)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.commands.playlist.noPlaylist,
                        color: EmbedColors.Red,
                    },
                ],
            });

        const limit: number = 20;
        const privatePlaylists = playlists.filter((playlist): boolean => isApplicable && playlist.userId === author.id && !playlist.public);
        const publicPlaylists = playlists.filter((playlist): boolean => playlist.public);

        const timestamp = (date: Date): number => Math.floor(date.getTime() / 1e3);

        const formatPrivatePlaylist = (playlist: (typeof privatePlaylists)[number]): string =>
            `• \`${playlist.playlistId}\` - **${truncate(playlist.playlistName, 28)}** | \`${playlist.tracks.length}\` tracks | <t:${timestamp(playlist.createdAt)}:R>`;

        const formatPublicPlaylist = (playlist: (typeof publicPlaylists)[number]): string =>
            `• \`${playlist.playlistId}\` - **${truncate(playlist.playlistName, 28)}** | <@${playlist.userId}> | \`${playlist.tracks.length}\` tracks | <t:${timestamp(playlist.createdAt)}:R>`;

        const privatePages: string[][] = chunk(privatePlaylists.map(formatPrivatePlaylist), limit);
        const publicPages: string[][] = chunk(publicPlaylists.map(formatPublicPlaylist), limit);
        const length: number = Math.max(privatePages.length, publicPages.length);

        const embeds: Embed[] = Array.from({ length }, (_, page: number): Embed => {
            const sections: string[] = [];

            if (isApplicable) {
                const privatePage: string[] = privatePages[page] ?? [];
                if (privatePage.length)
                    sections.push(
                        `### ${messages.commands.playlist.list.embed.titles.private} (${privatePlaylists.length})`,
                        privatePage.join("\n"),
                    );
            }

            const publicPage: string[] = publicPages[page] ?? [];
            if (publicPage.length)
                sections.push(
                    `### ${messages.commands.playlist.list.embed.titles.public} (${publicPlaylists.length})`,
                    publicPage.join("\n"),
                );

            return new Embed()
                .setTitle(messages.commands.playlist.list.title)
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
