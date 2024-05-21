import { ApplicationCommandOptionType } from "discord-api-types/v10";
import type { Command, CommandOption, SeyfertNumberOption, SeyfertStringOption, SubCommand } from "seyfert";

type ValidLongTextTags = "'" | '"' | "`";
type ValidNamedOptionSyntax = "-" | "--" | ":";

export interface YunaParserCreateOptions {
    /**
     * this only show console.log with the options parsed.
     * @defaulst false */
    logResult?: boolean;

    enabled?: {
        /** especify what longText tags you want
         *
         * ` " ` => `"penguin life"`
         *
         * ` ' ` => `'beautiful sentence'`
         *
         * **&#96;** => **\`LiSA『Shouted Serenade』 is a good song\`**
         *
         * @default 🐧 all enabled
         */
        longTextTags?: [ValidLongTextTags?, ValidLongTextTags?, ValidLongTextTags?];
        /** especify what named syntax you want
         *
         * ` - ` -option content value
         *
         * ` -- ` --option content value
         *
         * ` : ` option: content value
         *
         * @default 🐧 all enabled
         */
        namedOptions?: [ValidNamedOptionSyntax?, ValidNamedOptionSyntax?, ValidNamedOptionSyntax?];
    };

    /**
     * Turning it on can be useful for when once all the options are obtained,
     * the last one can take all the remaining content, ignoring any other syntax.
     * @default {false}
     */
    breakSearchOnConsumeAllOptions?: boolean;

    /**
     * Limit that you can't use named syntax "-" and ":" at the same time,
     * but only the first one used, sometimes it's useful to avoid confusion.
     * @default {false}
     */
    useUniqueNamedSyntaxAtSameTime?: boolean;

    /**
     * This disables the use of longTextTags in the last option
     * @default {false}
     */
    disableLongTextTagsInLastOption?: boolean;

    /** Use Yuna's choice resolver instead of the default one, put null if you don't want it,
     *
     * YunaChoiceResolver allows you to search through choices regardless of case or lowercase,
     * as well as allowing direct use of an choice's value,
     * and not being forced to use only the name.
     *
     * @default enabled
     */
    resolveCommandOptionsChoices?: {
        /** Allow you to use the value of a choice directly, not necessarily search by name
         * @default {true}
         */
        canUseDirectlyValue?: boolean;
    } | null;
}

type EscapeModeType = Record<string, RegExp | undefined>;

const RemoveNamedEscapeModeKeys = ["All", "forNamed", "forNamedDotted"];

export const RemoveFromCheckNextChar = (regex: RegExp, char: "\\-" | ":") => {
    return new RegExp(regex.source.replace(char, ""), regex.flags);
};

export const RemoveNamedEscapeMode = (EscapeMode: EscapeModeType, char: "\\-" | ":") => {
    for (const mode of RemoveNamedEscapeModeKeys) {
        const regx = EscapeMode[mode];
        if (!regx) continue;

        const regexStr = regx.source.replace(char, "");

        EscapeMode[mode] = new RegExp(regexStr, EscapeMode[mode]?.flags);
    }

    return EscapeMode;
};
export const RemoveLongCharEscapeMode = (EscapeMode: EscapeModeType) => {
    const regx = EscapeMode.All;
    if (!regx) return;

    const regexStr = regx.source.replace(/\\"|\\'|\\`/g, "");

    EscapeMode.All = new RegExp(regexStr, EscapeMode.All?.flags);

    return EscapeMode;
};

export const createRegexs = ({ enabled }: YunaParserCreateOptions) => {
    const hasAnyLongTextTag = (enabled?.longTextTags?.length ?? 0) >= 1;
    const hasAnyNamedSyntax = (enabled?.namedOptions?.length ?? 0) >= 1;

    const hasAnyEspecialSyntax = hasAnyNamedSyntax || hasAnyLongTextTag;

    const backescape = hasAnyEspecialSyntax ? "\\\\" : "";

    const escapeModes: EscapeModeType = {};

    const syntaxes: string[] = [];

    const has1HaphenSyntax = enabled?.namedOptions?.includes("-");
    const has2HaphenSyntax = enabled?.namedOptions?.includes("--");
    const hasDottedSyntax = enabled?.namedOptions?.includes(":");

    const escapedLongTextTags =
        enabled?.longTextTags
            ?.map((tag) => {
                escapeModes[tag!] = new RegExp(`(\\\\+)([${tag}\\s]|$)`, "g");

                return `\\${tag}`;
            })
            .join("") ?? "";

    let checkNextChar: RegExp | undefined = undefined;

    if (hasAnyEspecialSyntax) {
        const extras: string[] = [];

        (has1HaphenSyntax || has2HaphenSyntax) && extras.push("\\-");
        hasDottedSyntax && extras.push(":");

        const render = `${escapedLongTextTags}${extras.join("")}`;

        escapeModes.All = new RegExp(`(\\\\+)([${render}\\s]|$)`);

        checkNextChar = new RegExp(`[${render}\\s]|$`);

        syntaxes.push(`(?<tag>[${render}])`);
    }

    syntaxes.push(`(?<value>[^\\s\\x7F${escapedLongTextTags}${backescape}]+)`);

    if (hasAnyNamedSyntax) {
        const namedSyntaxes: string[] = [];

        if (has1HaphenSyntax || has2HaphenSyntax) {
            const HaphenLength = [];

            has1HaphenSyntax && HaphenLength.push(1);
            has2HaphenSyntax && HaphenLength.push(2);

            namedSyntaxes.push(`(?<hyphens>-{${HaphenLength.join(",")}})(?<hyphensname>[a-zA-Z_\\d]+)`);
            escapeModes.forNamed = /(\\+)([\:\s\-]|$)/g;
        } else {
            RemoveNamedEscapeMode(escapeModes, "\\-");
        }

        if (hasDottedSyntax) {
            namedSyntaxes.push("(?<dotsname>[a-zA-Z_\\d]+)(?<dots>:)(?!\\/\\/[^\\s\\x7F])");
            escapeModes.forNamedDotted = /(\\+)([\:\s\-\/]|$)/g;
        } else {
            RemoveNamedEscapeMode(escapeModes, ":");
        }

        namedSyntaxes.length && syntaxes.unshift(`(?<named>(\\\\*)(?:${namedSyntaxes.join("|")}))`);
    }

    if (backescape) {
        syntaxes.push("(?<backescape>\\\\+)");
    }

    return {
        elementsRegex: RegExp(syntaxes.join("|"), "g"),
        escapeModes: escapeModes,
        checkNextChar,
    };
};

const removeDuplicates = <A>(arr: A extends Array<infer R> ? R[] : never[]): A => {
    return [...new Set(arr)] as A;
};

export const createConfig = (config: YunaParserCreateOptions, isFull = true) => {
    const newConfig: YunaParserCreateOptions = {};

    if (isFull || (config.enabled && (config.enabled.longTextTags || config.enabled.namedOptions))) {
        newConfig.enabled ??= {};

        if (isFull || config?.enabled?.longTextTags)
            newConfig.enabled.longTextTags = removeDuplicates(config?.enabled?.longTextTags ?? ['"', "'", "`"]);
        if (isFull || config?.enabled?.namedOptions)
            newConfig.enabled.namedOptions = removeDuplicates(config?.enabled?.namedOptions ?? ["-", "--", ":"]);
    }

    if (isFull || "breakSearchOnConsumeAllOptions" in config)
        newConfig.breakSearchOnConsumeAllOptions = config.breakSearchOnConsumeAllOptions === true;
    if (isFull || "useUniqueNamedSyntaxAtSameTime" in config)
        newConfig.useUniqueNamedSyntaxAtSameTime = config.useUniqueNamedSyntaxAtSameTime === true;
    if (isFull || "logResult" in config) newConfig.logResult = config.logResult === true;
    if (isFull || "disableLongTextTagsInLastOption" in config)
        newConfig.disableLongTextTagsInLastOption = config.disableLongTextTagsInLastOption === true;
    if (isFull || "resolveCommandOptionsChoices" in config)
        newConfig.resolveCommandOptionsChoices =
            config.resolveCommandOptionsChoices === null
                ? null
                : {
                      canUseDirectlyValue: !(config.resolveCommandOptionsChoices?.canUseDirectlyValue === false),
                  };

    return newConfig;
};

export interface CommandYunaMetaDataConfig {
    options?: CommandOption[];
    config?: YunaParserCreateOptions;
    regexes?: ReturnType<typeof createRegexs>;
    choicesOptions?: {
        names: string[];
        decored?: Record<string, [rawName: string, /** in lowercase */ name: string, value: string | number][]>;
    };
}

export const keyMetadata = Symbol("YunaParserMetaData");
const keyConfig = Symbol("YunaParserConfig");

export type YunaParserUsableCommand = (Command | SubCommand) & {
    [keyMetadata]?: CommandYunaMetaDataConfig;
    [keyConfig]?: YunaParserCreateOptions;
};

export const ParserRecommendedConfig = {
    /** things that I consider necessary in an Eval command. */
    Eval: {
        breakSearchOnConsumeAllOptions: true,
        disableLongTextTagsInLastOption: true,
    },
} satisfies Record<string, YunaParserCreateOptions>;

export function DeclareParserConfig(config: YunaParserCreateOptions = {}) {
    return <T extends { new (...args: any[]): {} }>(target: T) => {
        if (!Object.keys(config).length) return target;

        return class extends target {
            [keyConfig] = createConfig(config, false);
        };
    };
}

type Object = Record<string | number | symbol, any>;

const isObject = (obj: unknown): obj is Object => typeof obj === "object" && obj !== null && !Array.isArray(obj);

const mergeObjects = <A, B>(obj: A, obj2: B): (A & B) | B => {
    if (!(isObject(obj) && isObject(obj2))) return obj2;

    const merged = { ...obj };

    if (!isObject(obj)) return obj2;

    for (const key of Object.keys(obj2)) {
        const oldValue = merged[key];
        const value = obj2[key];

        merged[key as keyof A & B] = mergeObjects(oldValue, value);
    }

    return merged as A & B;
};

const InvalidOptionType = new Set([
    ApplicationCommandOptionType.Attachment,
    ApplicationCommandOptionType.Subcommand,
    ApplicationCommandOptionType.SubcommandGroup,
]);

export const getYunaMetaDataFromCommand = (config: YunaParserCreateOptions, command: YunaParserUsableCommand) => {
    const InCache = command[keyMetadata];
    if (InCache) return InCache;

    const metadata: CommandYunaMetaDataConfig = {
        options: command.options?.filter((option) => "type" in option && !InvalidOptionType.has(option.type)) as
            | CommandOption[]
            | undefined,
    };

    const commandConfig = command[keyConfig];

    if (commandConfig) {
        const realConfig = mergeObjects(config, commandConfig);

        metadata.config = realConfig;
        metadata.regexes = createRegexs(realConfig);
    }

    if (metadata.options?.length) {
        const namesOfOptionsWithChoices: string[] = [];

        for (const option of metadata.options as ((SeyfertStringOption | SeyfertNumberOption) & CommandOption)[]) {
            if (!option.choices?.length) continue;

            namesOfOptionsWithChoices.push(option.name);
        }

        metadata.choicesOptions = {
            names: namesOfOptionsWithChoices,
        };
    }

    command[keyMetadata] = metadata;

    return metadata;
};
