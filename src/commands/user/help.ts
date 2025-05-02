import {
    ActionRow,
    Command,
    ContextMenuCommand,
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type Message,
    Options,
    StringSelectOption,
    SubCommand,
    type WebhookMessage,
    createStringOption,
} from "seyfert";
import { StelleOptions } from "#stelle/utils/decorator.js";

import { EmbedColors } from "seyfert/lib/common/index.js";
import type { APIApplicationCommandOption, ApplicationCommandOptionType, LocaleString } from "seyfert/lib/types/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { StelleCategory } from "#stelle/types";
import { getFormattedOptions } from "#stelle/utils/functions/options.js";
import { TimeFormat } from "#stelle/utils/functions/time.js";
import { sliceText } from "#stelle/utils/functions/utils.js";
import { EmbedPaginator, StelleStringMenu } from "#stelle/utils/paginator.js";

const options = {
    command: createStringOption({
        autocomplete(interaction): Promise<void> {
            const { client } = interaction;
            const { messages } = client.t(interaction.locale).get();

            const commands = client.commands.values.filter((command) => !command.guildId);
            const input = interaction.getInput();
            if (!input) {
                return interaction.respond(
                    commands
                        .map((command) => {
                            const description = command.description_localizations?.[interaction.locale] ?? command.description;

                            return {
                                name: `${command.name} - ${sliceText(description, 124)} (${TimeFormat.toHumanize((command.cooldown ?? 3) * 1000)})`,
                                value: command.name,
                            };
                        })
                        .slice(0, 25),
                );
            }

            const command = commands.find((command) => command.name === input);
            if (!command)
                return interaction.respond([
                    {
                        name: messages.events.autocomplete.noCommand,
                        value: "noCommand",
                    },
                ]);

            const description = command.description_localizations?.[interaction.locale] ?? command.description;

            return interaction.respond([
                {
                    name: `${command.name} - ${sliceText(description, 124)} (${TimeFormat.toHumanize((command.cooldown ?? 3) * 1000)})`,
                    value: command.name,
                },
            ]);
        },
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
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<Message | WebhookMessage | void> {
        const { client, options } = ctx;
        const { messages } = await ctx.getLocale();

        if (options.command === "noCommand")
            return ctx.editOrReply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    {
                        color: EmbedColors.Red,
                        description: messages.commands.help.noCommand,
                    },
                ],
            });

        const commands = client.commands.values.filter((command) => !command.guildId);
        const categoryList = commands
            .map((command) => Number(command.category))
            .filter((item, index, commands) => commands.indexOf(item) === index);

        const getAlias = (category: StelleCategory): string => messages.commands.help.aliases[category];

        if (!options.command) {
            const paginator = new EmbedPaginator({ ctx, disabled: true });
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
                        const commands = client.commands.values.filter((command) => command.category === Number(category));

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

        const command = commands.find((command) => command.name === options.command);
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

/**
 *
 * Parses a command to a string.
 * @param command The command to parse.
 * @param optionsType The options type.
 * @param locale The locale to use.
 * @returns {string} The parsed command.
 */
function parseCommand(
    command: Command | ContextMenuCommand,
    optionsType: Record<ApplicationCommandOptionType, string>,
    locale?: LocaleString,
): string {
    if (command instanceof ContextMenuCommand) return command.name;
    let content = command.name;
    for (const option of command.options ?? []) {
        if (option instanceof SubCommand) {
            content += `\n    ${parseSubCommand(option, optionsType)}`;
        } else {
            content += ` ${getFormattedOptions([option as APIApplicationCommandOption], optionsType).at(0)?.option}`;
        }
    }

    return `\`${content}\`\n* ${command.description_localizations?.[locale!] ?? command.description}`;
}

/**
 *
 * Parses a subcommand to a string.
 * @param subCommand The subcommand to parse.
 * @param optionsType The options type.
 * @returns {string} The parsed subcommand.
 */
function parseSubCommand(subCommand: SubCommand, optionsType: Record<ApplicationCommandOptionType, string>): string {
    if (!subCommand.options?.length) return `↪ ${subCommand.name}`;
    return `↪ ${subCommand.group ?? ""} ${subCommand.name} ${getFormattedOptions(
        subCommand.options as APIApplicationCommandOption[],
        optionsType,
    )
        .map((x) => x.option)
        .join(" ")}`.trim();
}
