import { OpCodes, type Stats } from "hoshimi";
import {
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    SubCommand,
    type WebhookMessageStructure,
} from "seyfert";
import type { APIEmbedField } from "seyfert/lib/types/index.js";
import { Shortcut } from "yunaforseyfert";
import { EmbedPaginator } from "#stelle/classes/components/EmbedPaginator.js";
import { LoggerOps } from "#stelle/utils/functions/internal/logger.js";
import { TimeFormat } from "#stelle/utils/functions/internal/time.js";

/**
 * Default stats for a node.
 * @type {Stats}
 */
const defaultStats: Stats = {
    op: OpCodes.Stats,
    players: 0,
    playingPlayers: 0,
    uptime: 0,
    memory: {
        allocated: 0,
        free: 0,
        reservable: 0,
        used: 0,
    },
    frameStats: {
        deficit: 0,
        nulled: 0,
        sent: 0,
    },
    cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
    },
};

@Declare({
    name: "nodes",
    description: "Get the status of all Stelle nodes.",
})
@LocalesT("locales.info.subcommands.nodes.name", "locales.info.subcommands.nodes.description")
@Shortcut()
export default class InfoNodesSubcommand extends SubCommand {
    public override async run(ctx: GuildCommandContext): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client } = ctx;
        const { messages } = await ctx.locale();

        const limit = 25;
        const fields: APIEmbedField[] = client.manager.nodeManager.nodes.map((node) => {
            const stats = node.stats ?? defaultStats;

            return {
                name: `\`🔰\` ${node.id}`,
                inline: true,
                value: messages.commands.info.nodes.value({
                    state: messages.commands.info.nodes.states[node.state],
                    players: stats.players,
                    uptime: TimeFormat.toHumanize(stats.uptime),
                    memory: `${LoggerOps.memoryUsage(stats.memory.used)} / ${LoggerOps.memoryUsage(stats.memory.allocated)}`,
                    cpu: `${stats.cpu.lavalinkLoad.toFixed(2)}% / ${stats.cpu.systemLoad.toFixed(2)}% (Cores: ${stats.cpu.cores})`,
                }),
            };
        });

        if (!fields.length) return ctx.errorReply(messages.commands.info.nodes.noNodes);

        if (fields.length < limit) {
            await ctx.editOrReply({
                embeds: [
                    new Embed()
                        .setDescription(messages.commands.info.nodes.description)
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
                        .setDescription(messages.commands.info.nodes.description)
                        .setColor(client.config.color.success)
                        .addFields(fields.slice(i, i + limit))
                        .setTimestamp(),
                );
            }

            await paginator.reply();
        }
    }
}
