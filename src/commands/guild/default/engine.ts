import { type CommandContext, Declare, LocalesT, Options, SubCommand, createStringOption } from "seyfert";
import { Shortcut } from "yunaforseyfert";

const engines: Record<string, string> = {
    spotify: "Spotify",
    youtube: "Youtube",
    youtube_music: "Youtube Music",
};

const options = {
    engine: createStringOption({
        description: "Select the engine.",
        required: true,
        locales: {
            name: "locales.default.subcommands.engine.option.name",
            description: "locales.default.subcommands.engine.option.description",
        },
        choices: [
            {
                name: "Spotify",
                value: "spotify",
            },
            {
                name: "Youtube",
                value: "youtube",
            },
            {
                name: "Youtube Music",
                value: "youtube_music",
            },
        ],
    }),
};

@Declare({
    name: "engine",
    description: "Change the player default search engine.",
})
@Options(options)
@LocalesT("locales.default.subcommands.engine.name", "locales.default.subcommands.engine.description")
@Shortcut()
export default class EngineSubcommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { engine } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        await client.database.setPlayer({ guildId, searchEngine: engine });
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.default.engine({ engine: engines[engine] }),
                },
            ],
        });
    }
}
