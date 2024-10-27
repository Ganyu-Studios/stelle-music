import { type APIApplicationCommandOption, ApplicationCommandOptionType } from "seyfert/lib/types/index.js";

/**
 *
 * Check if the option is required.
 * @param option The command option.
 * @param req If the option is required.
 * @returns
 */
const isRequired = (option: string, req?: boolean) => (req ? `<${option}>` : `[${option}]`);

type FormattedOption = {
    option: string;
    description: string;
    range: string;
};

/**
 *
 * Format the options and descriptions.
 * @param options The options.
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
                    range: `${getRange(option).trim()}`,
                });
            }
        }
    }

    return result;
}

/**
 *
 * Get the option min/max value.
 * @param option The option.
 * @returns
 */
function getRange(option: APIApplicationCommandOption): string {
    let text: string = "";

    switch (option.type) {
        case ApplicationCommandOptionType.String:
            {
                text += option.max_length ? ` Max: ${option.max_length}` : "";
                text += option.min_length ? ` Min: ${option.min_length}` : "";
            }
            break;

        case ApplicationCommandOptionType.Integer:
        case ApplicationCommandOptionType.Number:
            {
                text += option.max_value ? ` Max: ${option.max_value}` : "";
                text += option.min_value ? ` Min: ${option.min_value}` : "";
            }
            break;
    }

    return text;
}
