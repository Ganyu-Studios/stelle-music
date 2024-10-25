import { Declare, Command, type CommandContext, LocalesT, createStringOption, Options, ActionRow, Embed } from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { Configuration } from "#stelle/data/Configuration.js";
import { StelleCategory } from "#stelle/types";
import { EmbedPaginator, StelleStringMenu } from "#stelle/utils/Paginator.js";

const options = {
    command: createStringOption({
        description: "The command to get help for.",
        locales: {
            name: "locales.help.option.name",
            description: "locales.help.option.description",
        },
    }),
};

@Declare({
    name: "help",
    description: "The most useful command in the world!",
    guildId: Configuration.guildIds,
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@LocalesT("locales.help.name", "locales.help.description")
@StelleOptions({ category: StelleCategory.User, cooldown: 5 })
@Options(options)
export default class HelpCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options } = ctx;

        const categoryList = client
            .commands!.values.filter((command) => !command.guildId)
            .map((command) => Number(command.category))
            .filter((item, index, commands) => commands.indexOf(item) === index);

        if (!options.command) {
            const paginator = new EmbedPaginator(ctx).setDisabled(true);

            const row = new ActionRow<StelleStringMenu>().addComponents(
                new StelleStringMenu({
                    custom_id: "guild-helpMenu",
                    placeholder: "Select a command category.",
                    options: categoryList.map((category) => ({
                        label: StelleCategory[category],
                        value: category.toString(),
                    })),
                    run: async (interaction, setPage) => {
                        const category = interaction.values[0];
                        const commands = client.commands!.values.filter((command) => command.category === Number(category));

                        paginator.setEmbeds([]).setDisabled(false);

                        for (let i = 0; i < commands.length; i += 5) {
                            paginator.addEmbed(
                                new Embed()
                                    .setColor("Blurple")
                                    .setTitle("Help Menu")
                                    .setDescription("Select a command to get more information.")
                                    .addFields(
                                        commands.slice(i, i + 5).map((command) => ({
                                            name: command.name,
                                            value: command.description,
                                            inline: true,
                                        })),
                                    ),
                            );
                        }

                        return setPage(0);
                    },
                }),
            );

            paginator.setRows([row]);

            const embed = new Embed().setColor("Blurple").setTitle("Help Menu").setDescription("Select a command to get more information.");

            paginator.addEmbed(embed);

            await paginator.reply();

            return;
        }

        await ctx.editOrReply({ content: "No touching!" });
    }
}
