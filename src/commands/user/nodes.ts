import { Command, Declare, Embed, type GuildCommandContext, LocalesT, type Message, type WebhookMessage } from "seyfert";

import { StelleOptions } from "#stelle/utils/decorator.js";

import { EmbedColors } from "seyfert/lib/common/index.js";

import { StelleCategory } from "#stelle/types";
import { formatMemoryUsage } from "#stelle/utils/functions/logger.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Declare({
    name: "nodes",
    description: "Get the status of all Stelle nodes.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.User })
@LocalesT("locales.nodes.name", "locales.nodes.description")
export default class ExampleCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<Message | WebhookMessage | void> {
        const { client } = ctx;
        const { messages } = await ctx.getLocale();

        const maxFields = 25;
        const fields = client.manager.nodeManager.nodes.map((node) => ({
            name: `\`🔰\` ${node.id}`,
            inline: true,
            value: messages.commands.nodes.value({
                state: messages.commands.nodes.states[node.connected ? "connected" : "disconnected"],
                players: node.stats.players,
                uptime: TimeFormat.toHumanize(node.stats.uptime),
                memory: `${formatMemoryUsage(node.stats.memory.used)} / ${formatMemoryUsage(node.stats.memory.allocated)}`,
                cpu: `${node.stats.cpu.lavalinkLoad.toFixed(2)}% / ${node.stats.cpu.systemLoad.toFixed(2)}% (Cores: ${node.stats.cpu.cores})`,
            }),
        }));

        if (!fields.length)
            return ctx.editOrReply({
                embeds: [
                    {
                        description: messages.commands.nodes.noNodes,
                        color: EmbedColors.Red,
                    },
                ],
            });

        if (fields.length < maxFields) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setDescription(messages.commands.nodes.description)
                        .setColor(client.config.color.success)
                        .addFields(fields.slice(0, maxFields))
                        .setTimestamp(),
                ],
            });
        } else {
            const pages = new EmbedPaginator({ ctx });

            for (let i = 0; fields.length < maxFields; i += maxFields) {
                pages.addEmbed(
                    new Embed()
                        .setDescription(messages.commands.nodes.description)
                        .setColor(client.config.color.success)
                        .addFields(fields.slice(i, i + maxFields))
                        .setTimestamp(),
                );
            }

            await pages.reply();
        }
    }
}
