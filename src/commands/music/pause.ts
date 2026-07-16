import {
    Command,
    Declare,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Middlewares,
    type WebhookMessageStructure,
} from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "pause",
    description: "Pause the player.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["suspend", "hold"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.pause.name", "locales.pause.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class PauseCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<WebhookMessageStructure | MessageStructure | void> {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        if (player.paused) return ctx.errorReply(messages.commands.pause.alreadyPaused);

        await player.setPaused(true);
        await ctx.successReply(messages.commands.pause.success);
    }
}
