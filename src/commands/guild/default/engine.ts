import { Declare, type GuildCommandContext, LocalesT, Options, SubCommand, createStringOption } from "seyfert";

const engines: Record<string, string> = {
    spsearch: "Spotify",
    ytsearch: "Youtube",
    ytmsearch: "Youtube Music",
    scsearch: "Soundcloud",
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
                value: "spsearch",
            },
            {
                name: "Youtube",
                value: "ytsearch",
            },
            {
                name: "Youtube Music",
                value: "ytmsearch",
            },
            {
                name: "Soundcloud",
                value: "scsearch",
            },
        ] as const,
    }),
};

@Declare({
    name: "engine",
    description: "Change the player default search engine.",
})
@Options(options)
@LocalesT("locales.default.subcommands.engine.name", "locales.default.subcommands.engine.description")
export default class EngineSubcommand extends SubCommand {
    async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;
        const { engine } = options;

        const { messages } = await ctx.getLocale();

        await client.database.setPlayer(ctx.guildId, { searchPlatform: engine });
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.default.engine({
                        engine: engines[engine],
                        clientName: client.me.username,
                    }),
                },
            ],
        });
    }
}
