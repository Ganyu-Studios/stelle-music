import {
    createStringOption,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Options,
    SubCommand,
    type WebhookMessageStructure,
} from "seyfert";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { isUrl } from "#stelle/utils/functions/internal/utils.js";

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
    name: createStringOption({
        description: "The new name of the playlist.",
        required: true,
        locales: {
            name: "locales.playlist.commands.rename.option.name",
            description: "locales.playlist.commands.rename.option.description",
        },
    }),
};

@Declare({
    name: "rename",
    description: "Rename a music playlist.",
})
@LocalesT("locales.playlist.commands.rename.name", "locales.playlist.commands.rename.description")
@Options(options)
export default class RenameSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessageStructure | MessageStructure | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const { id, name } = ctx.options;

        const playlist = await client.database.playlist.get(id, ctx.author.id);
        if (!playlist) return ctx.errorReply(messages.commands.playlist.noPlaylist, { ephemeral: true, content: "" });

        if (isUrl(name)) return ctx.errorReply(messages.events.invalidInput, { ephemeral: true, content: "" });

        playlist.playlistName = name;

        await client.database.playlist.set(ctx.author.id, playlist);
        await ctx.successReply(messages.commands.playlist.renamed({ name }), { content: "" });
    }
}
