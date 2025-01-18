import { ActionRow, Button, type CommandContext, Declare, Embed, LocalesT, SubCommand } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";
import { Configuration } from "#stelle/data/Configuration.js";
import { BOT_VERSION } from "#stelle/data/Constants.js";
import { formatMemoryUsage } from "#stelle/utils/Logger.js";

@Declare({
    name: "bot",
    description: "Get the info about the bot.",
})
@LocalesT("locales.info.subcommands.bot.name", "locales.info.subcommands.bot.description")
export default class BotSubcommand extends SubCommand {
    public override async run(ctx: CommandContext) {
        const { messages } = await ctx.getLocale();
        const { client } = ctx;

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setDescription(
                messages.commands.info.bot.description({
                    clientName: client.me.username,
                    defaultPrefix: Configuration.defaultPrefix,
                }),
            )
            .addFields(
                {
                    inline: true,
                    name: messages.commands.info.bot.fields.info.name,
                    value: messages.commands.info.bot.fields.info.value({
                        guilds: client.cache.guilds!.count(),
                        players: client.manager.players.size,
                        users: client.cache.guilds!.values().reduce((a, b) => a + (b.memberCount ?? 0), 0),
                    }),
                },
                {
                    inline: true,
                    name: messages.commands.info.bot.fields.system.name,
                    value: messages.commands.info.bot.fields.system.value({
                        memory: formatMemoryUsage(process.memoryUsage().rss),
                        uptime: Math.floor(client.readyTimestamp / 1000),
                        version: BOT_VERSION,
                    }),
                },
            );

        const row = new ActionRow<Button>().addComponents(
            new Button().setStyle(ButtonStyle.Link).setLabel(messages.commands.info.bot.invite).setURL(Configuration.inviteLink),
            new Button().setStyle(ButtonStyle.Link).setLabel(messages.commands.info.bot.repository).setURL(Configuration.githubLink),
        );

        await ctx.editOrReply({ embeds: [embed], components: [row] });
    }
}
