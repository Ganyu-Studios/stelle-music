import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "autoplay",
    description: "Toggle the autoplay.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["auto", "ap"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@LocalesT("locales.autoplay.name", "locales.autoplay.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkTracks"])
export default class AutoplayCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        await player.data.set("enabledAutoplay", !(await player.data.get("enabledAutoplay")));

        const isAutoplay: boolean = (await player.data.get("enabledAutoplay"))!;

        await ctx.successReply(
            messages.commands.autoplay.toggled({
                type: messages.commands.autoplay.autoplayType[Constants.AutoplayState(isAutoplay)],
            }),
        );
    }
}
