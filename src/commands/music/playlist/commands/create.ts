import { createBooleanOption, createStringOption, Declare, type GuildCommandContext, LocalesT, Options, SubCommand } from "seyfert";
import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

const options = {
    name: createStringOption({
        description: "The name of the playlist to create.",
        required: true,
        locales: {
            name: "locales.playlist.commands.create.options.name.name",
            description: "locales.playlist.commands.create.options.name.description",
        },
    }),
    public: createBooleanOption({
        description: "Whether the playlist should be public or private.",
        required: false,
        locales: {
            name: "locales.playlist.commands.create.options.public.name",
            description: "locales.playlist.commands.create.options.public.description",
        },
    }),
};

@Declare({
    name: "create",
    description: "Create a new music playlist.",
})
@LocalesT("locales.playlist.commands.create.name", "locales.playlist.commands.create.description")
@Options(options)
export default class CreateSubCommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>) {
        const playlistName: string = ctx.options.name;
        const isPublic: boolean = ctx.options.public ?? false;

        const type: "public" | "private" = isPublic ? "public" : "private";

        const { client, author } = ctx;
        const { messages } = await ctx.locale();

        if (UtilsOps.isUrl(playlistName)) return ctx.errorReply(messages.events.invalidInput, { ephemeral: true, content: "" });

        const userPlaylistAmount: number = await client.database.playlist.countByUser(author.id);
        const playlistLimit: number = client.config.playlists.userLimit;

        if (userPlaylistAmount >= playlistLimit)
            return ctx.errorReply(messages.commands.playlist.limitReached({ amount: playlistLimit }), { ephemeral: true, content: "" });

        await client.database.playlist.set(author.id, {
            playlistName,
            createdAt: new Date(),
            public: isPublic,
            playlistId: UtilsOps.createId({ length: 6, segments: 4, separator: "-", uppercase: true }),
            tracks: [],
        });

        await ctx.successReply(
            messages.commands.playlist.created({
                name: playlistName,
                state: messages.commands.playlist.state[type],
            }),
            { ephemeral: true, content: "" },
        );
    }
}
