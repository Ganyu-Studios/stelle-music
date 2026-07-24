import {
    ActionRow,
    Command,
    ContextMenuCommand,
    createStringOption,
    Declare,
    Embed,
    type GuildCommandContext,
    LocalesT,
    type MessageStructure,
    Options,
    StringSelectOption,
    SubCommand,
    type WebhookMessageStructure,
} from "seyfert";
import type { APIApplicationCommandOption, ApplicationCommandOptionType, LocaleString } from "seyfert/lib/types/index.js";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { EmbedPaginator, StelleStringMenu } from "#stelle/classes/EmbedPaginator.js";
import { StelleCategory } from "#stelle/types";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { getFormattedOptions } from "#stelle/utils/functions/internal/options.js";
import { TimeFormat } from "#stelle/utils/functions/internal/time.js";
import { AutocompleteNoticeValue, UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * The type for a command that can be resolved to a command or a context menu command.
 */
type ResolvableCommand = Command | ContextMenuCommand;

const options = {
    command: createStringOption({
        autocomplete(interaction): Promise<void> {
            const { client } = interaction;
            const { messages } = client.t(interaction.locale).get();

            const commands: ResolvableCommand[] = client.commands.values.filter((command): boolean => !command.guildId);
            const input: string = interaction.getInput();
            if (!input.length) {
                return interaction.respond(
                    commands
                        .map((command): { name: string; value: string } => {
                            const description: string = command.description_localizations?.[interaction.locale] ?? command.description;

                            return {
                                name: `${command.name} - ${UtilsOps.truncate(description, 124)} (${TimeFormat.toHumanize((command.cooldown ?? 3) * 1000)})`,
                                value: command.name,
                            };
                        })
                        .slice(0, 25),
                );
            }

            const command: ResolvableCommand | undefined = commands.find((command) => command.name === input);
            if (!command) return interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.noCommand));

            const description: string = command.description_localizations?.[interaction.locale] ?? command.description;

            return interaction.respond([
                {
                    name: `${command.name} - ${UtilsOps.truncate(description, 124)} (${TimeFormat.toHumanize((command.cooldown ?? 3) * 1000)})`,
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
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
})
@LocalesT("locales.help.name", "locales.help.description")
@StelleOptions({ category: StelleCategory.User, cooldown: 5 })
@Options(options)
export default class HelpCommand extends Command {
    public override async run(ctx: GuildCommandContext<typeof options>): Promise<MessageStructure | WebhookMessageStructure | void> {
        const { client, options } = ctx;
        const { messages } = await ctx.locale();

        if (options.command === AutocompleteNoticeValue) return ctx.errorReply(messages.commands.help.noCommand, { ephemeral: true });

        const commands: ResolvableCommand[] = client.commands.values.filter((command): boolean => !command.guildId);
        const categoryList: number[] = commands
            .map((command): number => Number(command.category))
            .filter((item, index, commands): boolean => commands.indexOf(item) === index);

        const getAlias = (category: StelleCategory): string => messages.commands.help.aliases[category];

        const localeString = await ctx.localeString();

        if (!options.command) {
            const paginator: EmbedPaginator = new EmbedPaginator({ ctx, disabled: true });
            const row: ActionRow<StelleStringMenu> = new ActionRow<StelleStringMenu>().addComponents(
                new StelleStringMenu()
                    .setPlaceholder(messages.commands.help.selectMenu.placeholder)
                    .setCustomId("guild-helpMenu")
                    .setOptions(
                        categoryList.map(
                            (category): StringSelectOption =>
                                new StringSelectOption()
                                    .setLabel(getAlias(category))
                                    .setValue(category.toString())
                                    .setDescription(messages.commands.help.selectMenu.description({ category: getAlias(category) }))
                                    .setEmoji("📚"),
                        ),
                    )
                    .setRun((interaction, setPage) => {
                        const category: number = Number(interaction.values[0]);
                        const commands: ResolvableCommand[] = client.commands.values.filter(
                            (command): boolean => command.category === category,
                        );

                        paginator.setEmbeds([]).setDisabled(false);

                        for (let i: number = 0; i < commands.length; i += 5) {
                            const commandList: ResolvableCommand[] = commands.slice(i, i + 5);

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
                                                .map((command): string => parseCommand(command, messages.events.optionTypes, localeString))
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

        const command: ResolvableCommand | undefined = commands.find((command) => command.name === options.command);
        if (!command) return ctx.errorReply(messages.commands.help.noCommand, { ephemeral: true });

        const embed: Embed = new Embed()
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
                    options: parseCommand(command, messages.events.optionTypes, localeString),
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
    command: ResolvableCommand,
    optionsType: Record<ApplicationCommandOptionType, string>,
    locale?: LocaleString,
): string {
    if (command instanceof ContextMenuCommand) return command.name;
    let content: string = command.name;
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
    // getFormattedOptions returns [] for missing options, so no guard is needed.
    const options: string[] = getFormattedOptions(subCommand.options as APIApplicationCommandOption[] | undefined, optionsType).map(
        (x): string => x.option,
    );

    // Join only the present parts: a subcommand may have no group (top-level) and/or no options. The old two branches
    // dropped the group on optionless subs and left a double space when the group was empty.
    const parts: string[] = [subCommand.group, subCommand.name, ...options].filter((part): part is string => Boolean(part));

    return `↪ ${parts.join(" ")}`;
}
