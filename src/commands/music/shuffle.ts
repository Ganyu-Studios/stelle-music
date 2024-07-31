
import { Declare, Command, type CommandContext } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

@Declare({
    name: "shuffle",
    description: "Shuffle the queue.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
    aliases: ["shu", "sh", "shuf"],
})
@StelleOptions({ checkNodes: true, checkPlayer: true, checkQueue: true, inVoice: true, sameVoice: true, })
export default class ShuffleCommand extends Command {
    async run (ctx: CommandContext) {
        const { client } = ctx;

        const player = client.manager.getPlayer(ctx.guildId!);
        if (!player) return;

        const { messages } = await ctx.getLocale();

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
