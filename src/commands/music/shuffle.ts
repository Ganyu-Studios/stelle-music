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
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId);
        if (!player) return;

        const { messages } = await ctx.locale();

        await player.queue.shuffle();
        await ctx.editOrReply({
            embeds: [
                {
                    description: messages.commands.shuffle,
                    color: client.config.color.success,
                },
            ],
        });
    }
}
