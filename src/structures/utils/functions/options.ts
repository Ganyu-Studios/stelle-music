import { type APIApplicationCommandOption, ApplicationCommandOptionType } from "seyfert/lib/types/index.js";

/**
 * The formatted option type.
 */
export interface FormattedOption {
    /**
     * The option name.
     * @type {string}
     */
    option: string;
    /**
     * The option description.
     * @type {string}
     */
    description: string;
    /**
     * The option number range.
     * @type {string}
     */
    range?: string;
}

/**
 *
 * Check if the option is required.
 * @param {string} option The command option.
 * @param {boolean} required If the option is required.
 * @returns {string} The formatted option.
 */
const isRequired = (option: string, required?: boolean): string => (required ? `<${option}>` : `[${option}]`);

/**
 *
 * Format the options and descriptions.
 * @param {APIApplicationCommandOption[]} options The options.
 * @returns {FormattedOption[]} The formatted options.
 */
export function getFormattedOptions(
    options?: APIApplicationCommandOption[],
    types?: Record<ApplicationCommandOptionType, string>,
): FormattedOption[] {
    if (!(options && types)) return [];

    const result: FormattedOption[] = [];

    for (const option of options) {
        switch (option.type) {
            case ApplicationCommandOptionType.Subcommand:
            case ApplicationCommandOptionType.SubcommandGroup: {
                return getFormattedOptions(option.options, types);
            }

            default:
                {
                    result.push({
                        option: `--${option.name} ${isRequired(types[option.type], option.required)}`,
                        description: option.description,
                        range: getRange(option),
                    });
                }
                break;
        }
    }

    return result;
}

/**
 *
 * Get the option min/max value.
 * @param {APIApplicationCommandOption} option The option.
 * @returns {string} The range.
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

        default:
            break;
    }

    return text.trim();
}
