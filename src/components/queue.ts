import { ComponentCommand, type GuildComponentContext, Middlewares } from "seyfert";
import { displayQueue } from "#stelle/utils/functions/manager/queue.js";

@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class QueueComponent extends ComponentCommand {
    override componentType = "Button" as const;
    override customId = "player-guildQueue";

    async run(ctx: GuildComponentContext<typeof this.componentType>): Promise<void> {
        await displayQueue(ctx);
    }
}
