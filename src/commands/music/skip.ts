import { type CommandContext, createIntegerOption, Middlewares, LocalesT, Command, Declare, Options } from "seyfert";
import { StelleOptions } from "#stelle/decorators";
import { StelleCategory } from "#stelle/types";

const options = {
    to: createIntegerOption({
        description: "Skip a specific amount of songs.",
        locales: {
            name: "locales.skip.option.to.name",
            description: "locales.skip.option.to.description"
        }
    })
};

@Declare({
    name: "skip",
    description: "Skip the current track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["sk"]
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music
})
@LocalesT("locales.skip.name", "locales.skip.description")
@Options(options)
export default class SkipCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { to } = options;

        if (!guildId) {
            return;
        }

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) {
            return;
        }

        if (to) {
            await player.skip(to - 1, !player.get("enabledAutoplay"));
        } else {
            await player.skip(undefined, !player.get("enabledAutoplay"));
        }

        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.skip({ amount: to ?? 1 }),
                    color: client.config.color.success
                }
            ]
        });
    }
}
