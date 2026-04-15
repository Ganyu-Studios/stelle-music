import { createIntegerOption, Declare, type GuildCommandContext, LocalesT, Options, SubCommand } from "seyfert";
import { Shortcut } from "yunaforseyfert";

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
@Shortcut()
export default class VolumeSubcommand extends SubCommand {
    async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { volume } = options;

        const { messages } = await ctx.locale();

        await client.database.players.set(ctx.guildId, { defaultVolume: volume });
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.default.volume({
                        volume,
                        clientName: client.me.username,
                    }),
                },
            ],
        });
    }
}
