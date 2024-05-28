import { type APIApplicationCommandOption, ApplicationCommandOptionType } from "discord-api-types/v10";

const isRequired = (option: string, req?: boolean) => (req ? `<${option}>` : `[${option}]`);

type FormattedOption = {
    option: string;
    description: string;
};

/**
 *
 * Format the options and descriptions.
 * @param options
 * @returns
 */
export function formatOptions(
    options?: APIApplicationCommandOption[],
    types?: Record<ApplicationCommandOptionType, string>,
): FormattedOption[] {
    if (!(options && types)) return [];

    const result: FormattedOption[] = [];

    for (const option of options) {
        switch (option.type) {
            case ApplicationCommandOptionType.Subcommand:
            case ApplicationCommandOptionType.SubcommandGroup: {
                return formatOptions(option.options, types);
            }

            default: {
                result.push({
                    option: `--${option.name} ${isRequired(types[option.type], option.required)}`,
                    description: option.description,
                });
            }
        }
    }

    return result;
}
