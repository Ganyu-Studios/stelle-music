import { Command, type CommandContext, Declare, LocalesT, Options, createIntegerOption } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

const options = {
    to: createIntegerOption({
        description: "Skip a specific amount of songs.",
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
@StelleOptions({ cooldown: 5, checkPlayer: true, inVoice: true, sameVoice: true, checkNodes: true })
@Options(options)
@LocalesT("locales.skip.name", "locales.skip.description")
export default class SkipCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const { client, options, guildId } = ctx;
        const { to } = options;

        if (!guildId) return;

        const { messages } = await ctx.getLocale();

        const player = client.manager.getPlayer(guildId);
        if (!player) return;

        if (to) await player.skip(to - 1);
        else await player.skip();

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
