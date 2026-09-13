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
    name: "resume",
    description: "Resume the player.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["unpause", "play"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.Music })
@LocalesT("locales.resume.name", "locales.resume.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ResumeCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<WebhookMessageStructure | MessageStructure | void> {
        const { messages } = await ctx.locale();

        const { player } = ctx.metadata.checkPlayer;

        if (!player.paused) return ctx.errorReply(messages.commands.resume.alreadyPlaying);

        await player.setPaused(false);
        await ctx.successReply(messages.commands.resume.success);
    }
}
