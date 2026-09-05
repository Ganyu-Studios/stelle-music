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
 * Wrap a type token in brackets that convey whether the option is required.
 * @param {string} token The option type token.
 * @param {boolean} required If the option is required.
 * @returns {string} The bracketed token: `<token>` when required, `[token]` otherwise.
 */
const bracket = (token: string, required?: boolean): string => (required ? `<${token}>` : `[${token}]`);

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
        if (option.type === ApplicationCommandOptionType.Subcommand || option.type === ApplicationCommandOptionType.SubcommandGroup) {
            return getFormattedOptions(option.options, types);
        }

        result.push({
            option: `--${option.name} ${bracket(types[option.type], option.required)}`,
            description: option.description,
            range: rangeOf(option),
        });
    }

    return result;
}

/**
 *
 * Get the option min/max value.
 * @param {APIApplicationCommandOption} option The option.
 * @returns {string} The range.
 */
function rangeOf(option: APIApplicationCommandOption): string {
    let text: string = "";

    switch (option.type) {
        case ApplicationCommandOptionType.String:
            if (option.max_length) text += ` Max: ${option.max_length}`;
            if (option.min_length) text += ` Min: ${option.min_length}`;
            break;

        case ApplicationCommandOptionType.Integer:
        case ApplicationCommandOptionType.Number:
            if (option.max_value) text += ` Max: ${option.max_value}`;
            if (option.min_value) text += ` Min: ${option.min_value}`;
            break;

        default:
            break;
    }

    return text.trim();
}
