import { type CommandContext, Declare, LocalesT, Options, SubCommand, createIntegerOption } from "seyfert";

const options = {
    volume: createIntegerOption({
        description: "Enter the volume.",
        required: true,
        min_value: 0,
        max_value: 100,
        locales: {
            name: "locales.volume.option.name",
            description: "locales.volume.option.description",
        },
    }),
};

@Declare({
    name: "volume",
    description: "Change the player default volume.",
})
@Options(options)
@LocalesT("locales.default.subcommands.volume.name", "locales.default.subcommands.volume.description")
export default class VolumeSubcommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>): Promise<void> {
        const { client, options, guildId } = ctx;
        const { volume } = options;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        await client.database.setPlayer({ guildId, defaultVolume: volume });
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.default.volume({ volume }),
                },
            ],
        });
    }
}
