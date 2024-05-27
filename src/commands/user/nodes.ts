import { type CommandContext, Declare, Embed, LocalesT } from "seyfert";
import { StelleCommand } from "#stelle/classes";

import { StelleOptions } from "#stelle/decorators";

import { EmbedPaginator } from "#stelle/utils/Paginator.js";
import { msParser } from "#stelle/utils/functions/utils.js";

@Declare({
    name: "nodes",
    description: "Get the status of all Stelle nodes.",
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@StelleOptions({ cooldown: 5 })
@LocalesT("locales.nodes.name", "locales.nodes.description")
export default class ExampleCommand extends StelleCommand {
    async run(ctx: CommandContext) {
        const { client } = ctx;
        const { messages } = ctx.t.get(await ctx.getLocale());

        const pages = new EmbedPaginator(ctx);
        const maxFields = 25;
        const fields = client.manager.nodes.map((node, i) => ({
            name: `\`🔰\` ${node.name} - #${i + 1}`,
            inline: true,
            value: messages.commands.nodes.value({
                state: messages.commands.nodes.states[node.state],
                players: node.stats?.players ?? 0,
                uptime: msParser(node.stats?.uptime),
            }),
        }));

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
