import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares, Options, createIntegerOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const options = {
    volume: createIntegerOption({
        description: "Enter the volume.",
        required: true,
        min_value: 1,
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
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@Options(options)
@LocalesT("locales.volume.name", "locales.volume.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class VolumeCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>) {
        const { client, options } = ctx;
        const { volume } = options;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        if (volume === 1) {
            await player.pause();
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
            await player.resume();
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        color: client.config.color.success,
                        description: messages.commands.volume.changed({
                            volume,
                            clientName: client.me.username,
                        }),
                    },
                ],
            });
        }

        await player.setVolume(volume);
        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.volume.changed({
                        volume,
                        clientName: client.me.username,
                    }),
                },
            ],
        });
    }
}
