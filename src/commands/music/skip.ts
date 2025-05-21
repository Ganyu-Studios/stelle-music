import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares, Options, createIntegerOption } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

const options = {
    to: createIntegerOption({
        description: "Skip a specific amount of tracks.",
        locales: {
            name: "locales.skip.option.to.name",
            description: "locales.skip.option.to.description",
        },
    }),
};

@Declare({
    name: "skip",
    description: "Skip the current track.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["sk"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@Options(options)
@LocalesT("locales.skip.name", "locales.skip.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class SkipCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<void> {
        const { client, options } = ctx;
        const { to } = options;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        if (to) await player.skip(to, !player.get("enabledAutoplay"));
        else await player.skip(undefined, !player.get("enabledAutoplay"));

        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.skip({ amount: to ?? 1 }),
                    color: client.config.color.success,
                },
            ],
        });
    }
}
