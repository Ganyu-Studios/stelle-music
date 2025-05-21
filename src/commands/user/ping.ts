import { Command, type CommandContext, Declare, Embed, LocalesT } from "seyfert";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";

@Declare({
    name: "ping",
    description: "Get the Stelle ping.",
    integrationTypes: ["GuildInstall", "UserInstall"],
    contexts: ["Guild", "BotDM", "PrivateChannel"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.User })
@LocalesT("locales.ping.name", "locales.ping.description")
export default class PingCommand extends Command {
    public override async run(ctx: CommandContext): Promise<void> {
        const { client } = ctx;
        const { messages } = await ctx.getLocale();

        const embed = new Embed().setColor(client.config.color.extra).setDescription(messages.commands.ping.message).setTimestamp();

        await ctx.editOrReply({ embeds: [embed] });

        const wsPing = Math.floor(client.gateway.latency);
        const clientPing = Math.floor(Date.now() - (ctx.message ?? ctx.interaction)!.createdTimestamp);
        const shardPing = Math.floor((await ctx.client.gateway.get(ctx.shardId)?.ping()) ?? 0);

        embed.setColor(client.config.color.success).setDescription(messages.commands.ping.response({ wsPing, clientPing, shardPing }));

        await ctx.editOrReply({ embeds: [embed] });
    }
}
