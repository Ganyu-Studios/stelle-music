import { Command, type CommandContext, Declare, LocalesT, Options, createIntegerOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

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
    description: "Modify the volume.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["v", "vol"],
})
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.volume.name", "locales.volume.description")
export default class VolumeCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { volume } = options;

        if (!guildId) return;

        const { messages } = ctx.t.get(await ctx.getLocale());

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        if (volume === 1) {
            player.pause(true);
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.volume.paused,
                        color: client.config.color.extra,
                    },
                ],
            });
        }

        if (volume > 1 && player.paused) {
            player.pause(false);
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.volume.changed({ volume }),
                        color: client.config.color.success,
                    },
                ],
            });
        }

        await player.setVolume(volume);
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.volume.changed({ volume }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
