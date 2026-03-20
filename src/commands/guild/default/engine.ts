import { SearchSources } from "hoshimi";
import { createStringOption, Declare, type GuildCommandContext, LocalesT, Options, SubCommand } from "seyfert";
import { Shortcut } from "yunaforseyfert";

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
                value: SearchSources.Spotify,
            },
            {
                name: "Youtube",
                value: SearchSources.Youtube,
            },
            {
                name: "Youtube Music",
                value: SearchSources.YoutubeMusic,
            },
            {
                name: "Soundcloud",
                value: SearchSources.SoundCloud,
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
@Shortcut()
export default class EngineSubcommand extends SubCommand {
    async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { engine } = options;

        const { messages } = await ctx.locale();

        await client.database.players.set(ctx.guildId, { searchPlatform: engine });
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
