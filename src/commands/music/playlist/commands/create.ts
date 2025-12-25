import { createBooleanOption, createStringOption, Declare, type GuildCommandContext, LocalesT, Options, SubCommand } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { createId } from "#stelle/utils/functions/utils.js";

/**
 *
 * Checks if the given input string is a valid URL.
 * @param {string} input The input string to check.
 * @returns {boolean} True if the input is a valid URL, false otherwise.
 */
function checkUrl(input: string): boolean {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:com\/invite|gg))\/\S+/i,
        /^(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[\w]{2,}(?:\/\S*)?$/i,
    ];

    return patterns.some((pattern) => pattern.test(input));
}

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

        if (checkUrl(playlistName))
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

        await client.database.playlist.set(author.id, {
            playlistName,
            createdAt: new Date(),
            public: isPublic,
            playlistId: createId({ length: 6, segments: 4, separator: "-", uppercase: true }),
            tracks: [],
        });

        await ctx.editOrReply({
            content: "",
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.commands.playlist.created({
                        name: playlistName,
                        state: messages.commands.playlist.state[type],
                    }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
