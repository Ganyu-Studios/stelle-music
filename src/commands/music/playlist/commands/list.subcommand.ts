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
import { EmbedPaginator } from "#stelle/classes/components/EmbedPaginator.js";
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

        // Scoped in the query: your own view lists your playlists plus every public one; a target's view lists only
        // that user's public playlists. Either way, other users' private playlists never leave the database.
        const playlists = (
            isApplicable ? await client.database.playlist.loadable(author.id) : await client.database.playlist.publicOf(target!.id)
        ).sort((a, b): number => Number(b.public) - Number(a.public) || b.createdAt.getTime() - a.createdAt.getTime());

        if (!playlists.length) return ctx.errorReply(messages.commands.playlist.noPlaylist, { ephemeral: true, content: "" });

        const privatePlaylists = playlists.filter((playlist): boolean => isApplicable && playlist.userId === author.id && !playlist.public);
        const publicPlaylists = playlists.filter((playlist): boolean => playlist.public);

        const timestamp = (date: Date): number => Math.floor(date.getTime() / 1e3);

        // Flatten both sections into a single ordered list (private first), each row tagged with its section and
        // numbered within it. Numbering is per section and — since the list is built once — stays continuous even
        // when a section spills across pages.
        type Row = { section: "private" | "public"; content: string };

        const rows: Row[] = [
            ...privatePlaylists.map(
                (playlist, index): Row => ({
                    section: "private",
                    content: messages.commands.playlist.list.entry.private({
                        index: index + 1,
                        id: playlist.playlistId,
                        name: UtilsOps.truncate(playlist.playlistName, 28),
                        tracks: playlist.tracks.length,
                        timestamp: timestamp(playlist.createdAt),
                    }),
                }),
            ),
            ...publicPlaylists.map(
                (playlist, index): Row => ({
                    section: "public",
                    content: messages.commands.playlist.list.entry.public({
                        index: index + 1,
                        id: playlist.playlistId,
                        name: UtilsOps.truncate(playlist.playlistName, 28),
                        tracks: playlist.tracks.length,
                        userId: playlist.userId,
                        timestamp: timestamp(playlist.createdAt),
                    }),
                }),
            ),
        ];

        const header = (section: Row["section"]): string =>
            section === "private"
                ? `### ${messages.commands.playlist.list.private} (${privatePlaylists.length})`
                : `### ${messages.commands.playlist.list.public} (${publicPlaylists.length})`;

        // One combined budget per page: slice 10 rows at a time, then re-group that slice by section so each
        // section present on the page gets its header (repeated when a section continues onto the next page).
        const length: number = 10;
        const embeds: Embed[] = [];

        for (let start: number = 0; start < rows.length; start += length) {
            const chunk: Row[] = rows.slice(start, start + length);
            const blocks: string[] = [];

            let i: number = 0;
            while (i < chunk.length) {
                const section: Row["section"] = chunk[i].section;
                const entries: string[] = [];

                while (i < chunk.length && chunk[i].section === section) {
                    entries.push(chunk[i].content);
                    i += 1;
                }

                blocks.push(`${header(section)}\n${entries.join("\n")}`);
            }

            embeds.push(
                new Embed()
                    .setTitle(messages.commands.playlist.list.available)
                    .setColor(client.config.color.extra)
                    .setDescription(blocks.join("\n\n")),
            );
        }

        if (embeds.length === 1)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [embeds[0]],
            });

        const paginator: EmbedPaginator = new EmbedPaginator({ ctx, embeds });

        await paginator.reply({ ephemeral: true });
    }
}
