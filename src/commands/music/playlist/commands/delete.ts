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
import { EmbedColors } from "seyfert/lib/common/index.js";
import { playlistAutocomplete as autocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";

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
    name: "delete",
    description: "Delete a music playlist.",
})
@LocalesT("locales.playlist.commands.delete.name", "locales.playlist.commands.delete.description")
@Options(options)
export default class DeleteSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessageStructure | MessageStructure | void> {
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

        await client.database.playlist.delete(ctx.author.id, id);
        await ctx.editOrReply({
            content: "",
            embeds: [
                {
                    description: messages.commands.playlist.deleted({ name: playlist.playlistName }),
                    color: EmbedColors.Green,
                },
            ],
        });
    }
}
