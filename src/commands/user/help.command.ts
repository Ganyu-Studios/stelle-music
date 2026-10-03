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
import type {
    APIApplicationCommandOption,
    APIApplicationCommandOptionChoice,
    ApplicationCommandOptionType,
    LocaleString,
} from "seyfert/lib/types/index.js";
import { ApplicationIntegrationType, InteractionContextType } from "seyfert/lib/types/index.js";
import { EmbedPaginator, StelleStringMenu } from "#stelle/classes/components/EmbedPaginator.js";
import { StelleCategory } from "#stelle/types/index.js";
import { StelleOptions } from "#stelle/utils/decorator.js";
import { getFormattedOptions } from "#stelle/utils/functions/internal/options.js";
import { TimeFormat } from "#stelle/utils/functions/internal/time.js";
import { AutocompleteNoticeValue, UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * The type for a command that can be resolved to a command or a context menu command.
 */
type ResolvableCommand = Command | ContextMenuCommand;

/**
 * The custom id of the help panel's category select menu.
 * @type {string}
 */
const HELP_MENU_ID: string = "guild-helpMenu";

/**
 * How many commands are listed per paginator page.
 * @type {number}
 */
const PER_PAGE: number = 5;

const options = {
    command: createStringOption({
        autocomplete(interaction): Promise<void> {
            const { client } = interaction;
            const { messages } = client.t(interaction.locale).get();

            const input: string = interaction.getInput().toLowerCase();

            /**
             * The name a member sees for the command: its localized name for their client locale, else the base name.
             * @param {ResolvableCommand} command The command.
             * @returns {string} The displayed command name.
             */
            const displayName = (command: ResolvableCommand): string => command.name_localizations?.[interaction.locale] ?? command.name;

            // Global commands whose base or localized name contains the input (an empty input matches all), prefix matches
            // first. Only the 25 that fit become choices, each capped at Discord's 100 characters (one longer name gets the
            // whole response rejected). The value stays the base name, which `run` resolves.
            const choices: APIApplicationCommandOptionChoice<string>[] = client.commands.values
                .filter(
                    (command): boolean =>
                        !command.guildId && (command.name.includes(input) || displayName(command).toLowerCase().includes(input)),
                )
                .sort(
                    (a, b): number =>
                        Number(displayName(b).toLowerCase().startsWith(input)) - Number(displayName(a).toLowerCase().startsWith(input)),
                )
                .slice(0, 25)
                .map((command): APIApplicationCommandOptionChoice<string> => {
                    const description: string = command.description_localizations?.[interaction.locale] ?? command.description;
                    const cooldown: string = TimeFormat.toHumanize((command.cooldown ?? 3) * 1000);

                    return {
                        name: UtilsOps.truncate(`${displayName(command)} - ${description} (${cooldown})`, 100),
                        value: command.name,
                    };
                });

            if (!choices.length) return interaction.respond(UtilsOps.autocomplete(messages.events.autocomplete.no.command));

            return interaction.respond(choices);
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

        const localeString: LocaleString = await ctx.localeString();
        const commands: ResolvableCommand[] = client.commands.values.filter((command): boolean => !command.guildId);

        const getAlias = (category: StelleCategory = StelleCategory.Unknown): string => messages.commands.help.aliases[category];

        // A specific command was requested: render just its detail card.
        if (options.command) {
            const command: ResolvableCommand | undefined = commands.find((command) => command.name === options.command);
            if (!command) return ctx.errorReply(messages.commands.help.noCommand, { ephemeral: true });

            // Only chat commands carry aliases; context menu commands don't. Fall back to the "not specified" text
            // when the command has none.
            let aliases: string = messages.commands.help.noAliases;
            if (command instanceof Command && command.aliases?.length) aliases = command.aliases.join(", ");

            const embed: Embed = new Embed()
                .setColor(client.config.color.success)
                .setThumbnail(ctx.author.avatarURL())
                .setTitle(
                    messages.commands.help.selectMenu.options.title({
                        category: getAlias(command.category),
                        clientName: client.me.username,
                    }),
                )
                .setDescription(
                    messages.commands.help.command({
                        aliases,
                        category: getAlias(command.category),
                        cooldown: TimeFormat.toHumanize((command.cooldown ?? 3) * 1000),
                        options: parseCommand(command, messages.events.optionTypes, localeString),
                    }),
                );

            return ctx.editOrReply({ embeds: [embed] });
        }

        // No command given: category picker + paginated command cards.
        const categories: number[] = commands
            .map((command): number => Number(command.category))
            .filter((item, index, categories): boolean => categories.indexOf(item) === index);

        const paginator: EmbedPaginator = new EmbedPaginator({ ctx, disabled: true });

        const menu: StelleStringMenu = new StelleStringMenu()
            .setPlaceholder(messages.commands.help.selectMenu.placeholder)
            .setCustomId(HELP_MENU_ID)
            .setOptions(
                categories.map(
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
                const inCategory: ResolvableCommand[] = client.commands.values.filter((command): boolean => command.category === category);

                paginator.setEmbeds([]).setDisabled(false);

                for (let i: number = 0; i < inCategory.length; i += PER_PAGE) {
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
                                    options: inCategory
                                        .slice(i, i + PER_PAGE)
                                        .map((command): string => parseCommand(command, messages.events.optionTypes, localeString))
                                        .join("\n\n"),
                                }),
                            ),
                    );
                }

                return setPage(0);
            });

        await paginator
            .setRows([new ActionRow<StelleStringMenu>().addComponents(menu)])
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
function parseCommand(command: ResolvableCommand, optionsType: Record<ApplicationCommandOptionType, string>, locale: LocaleString): string {
    if (command instanceof ContextMenuCommand) return command.name;
    let content: string = command.name;
    for (const option of command.options ?? []) {
        if (option instanceof SubCommand) {
            content += `\n    ${parseSubCommand(option, optionsType)}`;
        } else {
            content += ` ${getFormattedOptions([option as APIApplicationCommandOption], optionsType).at(0)?.option}`;
        }
    }

    return `\`${content}\`\n* ${command.description_localizations?.[locale] ?? command.description}`;
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
