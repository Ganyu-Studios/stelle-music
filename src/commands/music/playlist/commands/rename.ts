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
import { MessageFlags } from "seyfert/lib/types/index.js";
import { playlistAutocomplete } from "#stelle/utils/functions/autocompletes/playlist.js";
import { checkUrl } from "#stelle/utils/functions/utils.js";

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
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkVoicePermissions", "checkNodes"])
export default class RenameSubcommand extends SubCommand {
    public async run(ctx: GuildCommandContext<typeof options>): Promise<WebhookMessage | Message | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const { id, name } = ctx.options;

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

        if (checkUrl(name))
            return ctx.editOrReply({
                content: "",
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        description: messages.events.invalidInput,
                        color: EmbedColors.Red,
                    },
                ],
            });

        playlist.playlistName = name;

        await client.database.playlist.set(ctx.author.id, playlist);
        await ctx.editOrReply({
            content: "",
            embeds: [
                {
                    description: messages.commands.playlist.renamed({ name }),
                    color: EmbedColors.Green,
                },
            ],
        });
    }
}
