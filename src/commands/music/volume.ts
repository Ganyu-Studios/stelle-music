import { type CommandContext, createIntegerOption, Middlewares, LocalesT, Command, Declare, Options } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const options = {
    volume: createIntegerOption({
        description: "Enter the volume.",
        required: true,
        min_value: 0,
        max_value: 100,
        locales: {
            name: "locales.volume.option.name",
            description: "locales.volume.option.description"
        }
    })
};

@Declare({
    name: "volume",
    description: "Modify the volume.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["v", "vol"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.volume.name", "locales.volume.description")
@Options(options)
export default class VolumeCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { volume } = options;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        if (volume === 1) {
            await player.pause();
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.volume.paused,
                        color: client.config.color.extra
                    }
                ]
            });
        }

        if (volume > 1 && player.paused) {
            await player.resume();
            await player.setVolume(volume);

            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.volume.changed({ volume }),
                        color: client.config.color.success
                    }
                ]
            });
        }

        await player.setVolume(volume);
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.volume.changed({ volume }),
                    color: client.config.color.success
                }
            ]
        });
    }
}
