import { type CommandContext, Declare, Options, SubCommand, createStringOption } from "seyfert";

const engines: Record<string, string> = {
    spotify: "Spotify",
    youtube: "Youtube",
    youtube_music: "Youtube Music",
};

const options = {
    engine: createStringOption({
        description: "Enter the volume.",
        required: true,
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
export default class EngineSubcommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { engine } = options;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

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
