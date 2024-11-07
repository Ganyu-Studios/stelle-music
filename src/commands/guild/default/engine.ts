import type { SearchPlatform } from "lavalink-client";
import { type CommandContext, Declare, LocalesT, Options, SubCommand, createStringOption } from "seyfert";

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
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { engine } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        // yunaforsefert breaks the type of the engine option
        await client.database.setPlayer({ guildId, searchEngine: engine as SearchPlatform });
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
