import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "autoplay",
    description: "Toggle the autoplay.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["auto", "ap"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@LocalesT("locales.autoplay.name", "locales.autoplay.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { client } = ctx;

        const { messages } = await ctx.locale();

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        await player.data.set("enabledAutoplay", !(await player.data.get("enabledAutoplay")));

        const isAutoplay: boolean = (await player.data.get("enabledAutoplay"))!;

        await ctx.editOrReply({
            embeds: [
                {
                    color: client.config.color.success,
                    description: messages.commands.autoplay.toggled({
                        type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
                    }),
                },
            ],
        });
    }
}
