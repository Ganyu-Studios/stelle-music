import { Command, Declare, type GuildCommandContext, LocalesT, Middlewares } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { displayQueue } from "#stelle/utils/functions/manager/queue.js";

@Declare({
    name: "queue",
    description: "See the queue.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@LocalesT("locales.queue.name", "locales.queue.description")
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        await displayQueue(ctx);
    }
}
