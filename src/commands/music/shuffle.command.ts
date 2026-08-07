import { Command, Declare, type GuildCommandContext, Middlewares } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "shuffle",
    description: "Shuffle the queue.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
    aliases: ["shu", "sh", "shuf"],
})
@StelleOptions({
    cooldown: 5,
    category: StelleCategory.Music,
})
@Middlewares(["checkNodes", "checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer", "checkQueue"])
export default class ShuffleCommand extends Command {
    public override async run(ctx: GuildCommandContext<{}, "checkPlayer">): Promise<void> {
        const { player } = ctx.metadata.checkPlayer;

        const { messages } = await ctx.locale();

        await player.queue.shuffle();
        await ctx.successReply(messages.commands.shuffle);
    }
}
