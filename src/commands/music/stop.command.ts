import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "stop",
    description: "Stop the player.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["destroy", "leave"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.stop.name", "locales.stop.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class StopCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<void> {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        await player.destroy();
        await ctx.successReply(messages.commands.stop);
    }
}
