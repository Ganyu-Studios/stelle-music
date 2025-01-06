import {
    ActionRow,
    Command,
    type CommandContext,
    ContextMenuCommand,
    Declare,
    Embed,
    LocalesT,
    Options,
    StringSelectOption,
    SubCommand,
    createStringOption,
} from "seyfert";
import { StelleOptions } from "#stelle/decorators";

import { EmbedColors } from "seyfert/lib/common/index.js";
import type { ApplicationCommandOptionType, LocaleString } from "seyfert/lib/types/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { EmbedPaginator, StelleStringMenu } from "#stelle/utils/Paginator.js";
import { formatOptions } from "#stelle/utils/functions/formatter.js";

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
    integrationTypes: ["GuildInstall"],
    contexts: ["Guild"],
})
@LocalesT("locales.help.name", "locales.help.description")
@StelleOptions({ category: StelleCategory.User, cooldown: 5 })
@Options(options)
export default class HelpCommand extends Command {
    public override async run(ctx: CommandContext<typeof options>) {
        const { client, options } = ctx;
        const { messages } = await ctx.getLocale();

        const categoryList = client
            .commands!.values.filter((command) => !command.guildId)
            .map((command) => Number(command.category))
            .filter((item, index, commands) => commands.indexOf(item) === index);

        const getAlias = (category: StelleCategory) => messages.commands.help.aliases[category];

        if (!options.command) {
            const paginator = new EmbedPaginator(ctx).setDisabled(true);
            const row = new ActionRow<StelleStringMenu>().addComponents(
                new StelleStringMenu()
                    .setPlaceholder(messages.commands.help.selectMenu.placeholder)
                    .setCustomId("guild-helpMenu")
                    .setOptions(
                        categoryList.map((category) =>
                            new StringSelectOption()
                                .setLabel(getAlias(category))
                                .setValue(category.toString())
                                .setDescription(messages.commands.help.selectMenu.description({ category: getAlias(category) }))
                                .setEmoji("📚"),
                        ),
                    )
                    .setRun((interaction, setPage) => {
                        const category = Number(interaction.values[0]);
                        const commands = client.commands!.values.filter((command) => command.category === Number(category));

                        paginator.setEmbeds([]).setDisabled(false);

                        for (let i = 0; i < commands.length; i += 5) {
                            const commandList = commands.slice(i, i + 5);

                            paginator.addEmbed(
                                new Embed()
                                    .setColor(client.config.color.success)
                                    .setThumbnail(ctx.author.avatarURL())
                                    .setTitle(
                                        messages.commands.help.selectMenu.options.title({
                                            category: getAlias(category),
                                            clientName: client.me.username,
                                        }),
                                    )
                                    .setDescription(
                                        messages.commands.help.selectMenu.options.description({
                                            options: commandList
                                                .map((command) =>
                                                    parseCommand(command, messages.events.optionTypes, ctx.interaction?.locale),
                                                )
                                                .join("\n\n"),
                                        }),
                                    ),
                            );
                        }

                        return setPage(0);
                    }),
            );

            await paginator
                .setRows([row])
                .addEmbed(
                    new Embed()
                        .setColor(client.config.color.success)
                        .setTitle(messages.commands.help.title({ clientName: client.me.username }))
                        .setDescription(
                            messages.commands.help.description({
                                defaultPrefix: client.config.defaultPrefix,
                            }),
                        ),
                )
                .reply();

            return;
        }

        const command = client.commands!.values.filter((command) => !command.guildId).find((command) => command.name === options.command) as
            | Command
            | undefined;
        if (!command)
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.commands.help.noCommand,
                    },
                ],
            });

        const embed = new Embed()
            .setColor(client.config.color.success)
            .setThumbnail(ctx.author.avatarURL())
            .setTitle(
                messages.commands.help.selectMenu.options.title({
                    category: getAlias(command.category ?? StelleCategory.Unknown),
                    clientName: client.me.username,
                }),
            )
            .setDescription(
                messages.commands.help.selectMenu.options.description({
                    options: parseCommand(command, messages.events.optionTypes, ctx.interaction?.locale),
                }),
            );

        await ctx.editOrReply({ embeds: [embed] });
    }
}

function parseCommand(
    command: Command | ContextMenuCommand,
    optionsType: Record<ApplicationCommandOptionType, string>,
    locale?: string,
): string {
    if (command instanceof ContextMenuCommand) return command.name;
    let content = command.name;
    for (const option of command.options ?? []) {
        if (option instanceof SubCommand) {
            content += `\n    ${parseSubCommand(option, optionsType)}`;
        } else {
            content += ` ${
                formatOptions(
                    [
                        //@ts-expect-error
                        option,
                    ],
                    optionsType,
                ).at(0)?.option
            }`;
        }
    }

    return `\`\`\`\n${content}\n${command.description_localizations?.[locale as LocaleString] ?? command.description}\`\`\``;
}

function parseSubCommand(subCommand: SubCommand, optionsType: Record<ApplicationCommandOptionType, string>): string {
    if (!subCommand.options?.length) return subCommand.name;
    return `${subCommand.group ? `${subCommand.group} ` : ""}${subCommand.name} ${formatOptions(
        //@ts-expect-error
        subCommand.options,
        optionsType,
    )
        .map((x) => x.option)
        .join(" ")}`;
}
