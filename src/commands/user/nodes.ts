import { Command, Declare, Embed, type GuildCommandContext, LocalesT, type Message, type WebhookMessage } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import type { APIEmbedField } from "seyfert/lib/types/index.js";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { formatMemoryUsage } from "#stelle/utils/functions/internal/logger.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";
import { EmbedPaginator } from "#stelle/utils/paginator.js";

@Declare({
    name: "nodes",
    description: "Get the status of all Stelle nodes.",
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@StelleOptions({ cooldown: 5, category: StelleCategory.User })
@LocalesT("locales.nodes.name", "locales.nodes.description")
export default class NodesCommand extends Command {
    public override async run(ctx: GuildCommandContext): Promise<Message | WebhookMessage | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const limit = 25;
        const fields: APIEmbedField[] = client.manager.nodeManager.nodes.map((node) => ({
            name: `\`🔰\` ${node.id}`,
            inline: true,
            value: messages.commands.nodes.value({
                state: messages.commands.nodes.states[node.state],
                players: node.stats?.players ?? 0,
                uptime: TimeFormat.toHumanize(node.stats?.uptime ?? 0),
                memory: `${formatMemoryUsage(node.stats?.memory?.used ?? 0)} / ${formatMemoryUsage(node.stats?.memory?.allocated ?? 0)}`,
                cpu: `${node.stats?.cpu?.lavalinkLoad.toFixed(2) ?? 0}% / ${node.stats?.cpu?.systemLoad.toFixed(2) ?? 0}% (Cores: ${node.stats?.cpu?.cores ?? 0})`,
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

        if (fields.length < limit) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setDescription(messages.commands.nodes.description)
                        .setColor(client.config.color.success)
                        .addFields(fields.slice(0, limit))
                        .setTimestamp(),
                ],
            });
        } else {
            const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

            for (let i = 0; i < fields.length; i += limit) {
                paginator.addEmbed(
                    new Embed()
                        .setDescription(messages.commands.nodes.description)
                        .setColor(client.config.color.success)
                        .addFields(fields.slice(i, i + limit))
                        .setTimestamp(),
                );
            }

            await paginator.reply();
        }
    }
}
