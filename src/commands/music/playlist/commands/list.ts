import {
    createUserOption,
    Declare,
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
import { truncate } from "#stelle/utils/functions/utils.js";

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

        const limit = 10;

        const privatePlaylists = isApplicable
            ? playlists.filter((playlist): boolean => playlist.userId === author.id && !playlist.public)
            : [];

        const publicPlaylists = isApplicable
            ? playlists.filter((playlist): boolean => playlist.public)
            : playlists.filter((playlist): boolean => playlist.userId === target?.id && playlist.public);

        const timestamp = (date: Date): number => Math.floor(date.getTime() / 1e3);

        const privateLines: string[] = privatePlaylists
            .slice(0, limit)
            .map(
                (playlist): string =>
                    `• \`${playlist.playlistId}\` - **${truncate(playlist.playlistName, 33)}** | \`${playlist.tracks.length}\` tracks | <t:${timestamp(playlist.createdAt)}:R>`,
            );

        if (privatePlaylists.length > limit)
            privateLines.push(messages.commands.playlist.list.andMore({ amount: privatePlaylists.length - limit }));

        const publicLines: string[] = publicPlaylists
            .slice(0, limit)
            .map(
                (playlist): string =>
                    `• \`${playlist.playlistId}\` - **${truncate(playlist.playlistName, 33)}** | <@${playlist.userId}> | \`${playlist.tracks.length}\` tracks | <t:${timestamp(playlist.createdAt)}:R>`,
            );

        if (publicPlaylists.length > limit)
            publicLines.push(messages.commands.playlist.list.andMore({ amount: publicPlaylists.length - limit }));

        if (isApplicable)
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        title: messages.commands.playlist.list.title,
                        color: client.config.color.extra,
                        fields: [
                            {
                                name: `${messages.commands.playlist.state.private} (${privatePlaylists.length})`,
                                value: privateLines.join("\n") || messages.commands.playlist.list.noPrivate,
                            },
                            {
                                name: `${messages.commands.playlist.state.public} (${publicPlaylists.length})`,
                                value: publicLines.join("\n") || messages.commands.playlist.list.noPublic,
                            },
                        ],
                    },
                ],
            });

        return ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    title: messages.commands.playlist.list.title,
                    color: client.config.color.extra,
                    fields: [
                        {
                            name: `${messages.commands.playlist.state.public} (${publicPlaylists.length})`,
                            value: publicLines.join("\n") || messages.commands.playlist.list.noPublic,
                        },
                    ],
                },
            ],
        });
    }
}
