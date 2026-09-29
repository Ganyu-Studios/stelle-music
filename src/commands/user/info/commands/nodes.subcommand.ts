import { OpCodes, type Stats } from "hoshimi";
import {
    ActionRow,
    Button,
    type ButtonInteraction,
    Declare,
    type DefaultLocale,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    SubCommand,
    type UsingClient,
    type WebhookMessageStructure,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { type APIEmbedField, ButtonStyle, MessageFlags } from "seyfert/lib/types/index.js";
import { Shortcut } from "yunaforseyfert";
import { EmbedPaginator } from "#stelle/classes/components/EmbedPaginator.js";
import { LoggerOps } from "#stelle/utils/functions/internal/logger.js";
import { ms, TimeFormat } from "#stelle/utils/functions/internal/time.js";

/**
 * How many node fields fit in a single embed (Discord's field limit).
 * @type {number}
 */
const LIMIT: number = 25;

/**
 * The custom id of the node-stats refresh button.
 * @type {string}
 */
const REFRESH_ID: string = "info-nodes-refresh";

/**
 * How long the refresh button stays active without interaction before it's disabled.
 * @type {number}
 */
const IDLE_TIME: number = ms("2min");

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

/**
 *
 * Build the node fields fresh from the nodes' current stats. Called on every render so a refresh reflects live values.
 * @param {UsingClient} client The client instance.
 * @param {DefaultLocale["messages"]} messages The resolved locale messages.
 * @returns {APIEmbedField[]} One inline field per node.
 */
function renderFields(client: UsingClient, messages: DefaultLocale["messages"]): APIEmbedField[] {
    return client.manager.nodeManager.nodes.map((node): APIEmbedField => {
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
}

/**
 *
 * Build the refresh button row.
 * @param {DefaultLocale["messages"]} messages The resolved locale messages.
 * @param {boolean} [disabled] Whether the button should be disabled (e.g., after the collector idles out).
 * @returns {ActionRow<Button>} The row with the refresh button.
 */
function refreshRow(messages: DefaultLocale["messages"], disabled: boolean = false): ActionRow<Button> {
    return new ActionRow<Button>().addComponents(
        new Button()
            .setCustomId(REFRESH_ID)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messages.commands.info.nodes.refresh)
            .setEmoji("🔄")
            .setDisabled(disabled),
    );
}

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

        const total: number = client.manager.nodeManager.nodes.size;
        if (!total) return ctx.errorReply(messages.commands.info.nodes.noNodes);

        // One embed for the slice of node fields starting at `start`, rebuilt from fresh stats each call.
        const page = (start: number): Embed =>
            new Embed()
                .setDescription(messages.commands.info.nodes.description)
                .setColor(client.config.color.success)
                .addFields(renderFields(client, messages).slice(start, start + LIMIT))
                .setTimestamp();

        // More than one page's worth of nodes: fall back to the paginator (no live refresh there).
        if (total > LIMIT) {
            const paginator: EmbedPaginator = new EmbedPaginator({ ctx });

            for (let i = 0; i < total; i += LIMIT) paginator.addEmbed(page(i));

            await paginator.reply();

            return;
        }

        // Single page: render with a refresh button and re-render fresh stats on each click until the collector idles.
        const message = await ctx.editOrReply({ embeds: [page(0)], components: [refreshRow(messages)] }, true);

        const collector = message.createComponentCollector({
            idle: IDLE_TIME,
            filter: (interaction): boolean => interaction.user.id === ctx.author.id,
            onPass: async (interaction): Promise<void> => {
                await interaction.editOrReply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [{ description: messages.events.only.user({ userId: ctx.author.id }), color: EmbedColors.Red }],
                });
            },
            onStop: async (): Promise<void> => {
                await message.edit({ components: [refreshRow(messages, true)] }).catch((): null => null);
            },
        });

        collector.run<ButtonInteraction>(REFRESH_ID, async (interaction): Promise<void> => {
            await interaction.deferUpdate();
            await interaction.editOrReply({ embeds: [page(0)], components: [refreshRow(messages)] });
        });
    }
}
