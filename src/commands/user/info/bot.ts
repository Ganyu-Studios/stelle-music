import { ActionRow, Button, type ClientUser, Declare, Embed, type Guild, type GuildCommandContext, LocalesT, SubCommand } from "seyfert";
import { ButtonStyle } from "seyfert/lib/types/index.js";

import { Shortcut } from "yunaforseyfert";
import { Constants } from "#stelle/utils/data/constants.js";
import { formatMemoryUsage } from "#stelle/utils/functions/logger.js";

@Declare({
    name: "bot",
    description: "Get the info about the bot.",
})
@LocalesT("locales.info.subcommands.bot.name", "locales.info.subcommands.bot.description")
@Shortcut()
export default class BotSubcommand extends SubCommand {
    public override async run(ctx: GuildCommandContext): Promise<void> {
        const { messages } = await ctx.getLocale();
        const { client } = ctx;

        const me: ClientUser = await client.me.fetch();
        const guilds: Guild<"cached">[] = client.cache.guilds?.values() ?? [];

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setImage(me.bannerURL({ size: 4096 }))
            .setDescription(
                messages.commands.info.bot.description({
                    clientName: client.me.username,
                    defaultPrefix: client.config.defaultPrefix,
                }),
            )
            .addFields(
                {
                    inline: true,
                    name: messages.commands.info.bot.fields.info.name,
                    value: messages.commands.info.bot.fields.info.value({
                        guilds: guilds.length,
                        users: guilds.reduce((a, b) => a + (b.memberCount ?? 0), 0),
                        players: client.manager.players.size,
                    }),
                },
                {
                    inline: true,
                    name: messages.commands.info.bot.fields.system.name,
                    value: messages.commands.info.bot.fields.system.value({
                        memory: formatMemoryUsage(process.memoryUsage().rss),
                        uptime: Math.floor(client.readyTimestamp / 1000),
                        version: Constants.Version,
                    }),
                },
            );

        const row: ActionRow<Button> = new ActionRow<Button>().addComponents(
            new Button().setStyle(ButtonStyle.Link).setLabel(messages.commands.info.bot.invite).setURL(client.config.inviteLink),
            new Button().setStyle(ButtonStyle.Link).setLabel(messages.commands.info.bot.repository).setURL(client.config.githubLink),
        );

        await ctx.editOrReply({ embeds: [embed], components: [row] });
    }
}
