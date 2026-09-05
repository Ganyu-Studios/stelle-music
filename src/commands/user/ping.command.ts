import { Command, type CommandContext, Declare, Embed, LocalesT } from "seyfert";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "ping",
    description: "Get the Stelle ping.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
    contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.User })
@LocalesT("locales.ping.name", "locales.ping.description")
export default class PingCommand extends Command {
    public override async run(ctx: CommandContext): Promise<void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const embed = new Embed().setColor(client.config.color.extra).setDescription(messages.commands.ping.message).setTimestamp();

        await ctx.editOrReply({ embeds: [embed] });

        const shardId = ctx.shardId;

        const wsPing = Math.floor(client.gateway.latency);
        const clientPing = Math.floor(Date.now() - (ctx.message ?? ctx.interaction)!.createdTimestamp);
        const shardPing = Math.floor((await ctx.client.gateway.get(shardId)?.ping()) ?? 0);

        embed
            .setColor(client.config.color.success)
            .setDescription(messages.commands.ping.response({ wsPing, clientPing, shardPing, shardId }));

        await ctx.editOrReply({ embeds: [embed] });
    }
}
