import { type CommandContext, createStringOption, SubCommand, LocalesT, Declare, Options } from "seyfert";

const engines: Record<string, string> = {
    spsearch: "Spotify",
    ytsearch: "Youtube",
    ytmsearch: "Youtube Music",
    scsearch: "Soundcloud"
};

const cmdOptions = {
    engine: createStringOption({
        description: "Select the engine.",
        required: true,
        locales: {
            name: "locales.default.subcommands.engine.option.name",
            description: "locales.default.subcommands.engine.option.description"
        },
        choices: [
            {
                name: "Spotify",
                value: "spsearch"
            },
            {
                name: "Youtube",
                value: "ytsearch"
            },
            {
                name: "Youtube Music",
                value: "ytmsearch"
            },
            {
                name: "Soundcloud",
                value: "scsearch"
            }
        ] as const
    })
};

@LocalesT("locales.default.subcommands.engine.name", "locales.default.subcommands.engine.description")
@Declare({
    name: "engine",
    description: "Change the player default search engine."
})
@Options(cmdOptions)
export default class EngineSubcommand extends SubCommand {
    async run(ctx: CommandContext<typeof cmdOptions>) {
        const { client, options, guildId } = ctx;
        const { engine } = options;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        await client.database.setPlayer({
            guildId,
            searchEngine: engine
        });
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.default.engine({ engine: engines[engine] })
                }
            ]
        });
    }
}
