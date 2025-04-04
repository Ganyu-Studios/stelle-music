import type { LocaleString } from "seyfert/lib/types/index.js";

/**
 * The colors configuration interface.
 */
interface Colors {
    /**
     * The primary color of the bot.
     * @default 0x8d86a8
     * @type {number}
     */
    success: number;
    /**
     * The secondary color of the bot.
     * @default 0xece8f1
     * @type {number}
     */
    extra: number;
}

/**
 * The commands configuration interface.
 */
interface Commands {
    /**
     * Make the bot reply to the user.
     * @default true
     */
    reply: boolean;
    /**
     * The default prefix used to use text commands.
     * @type {string}
     * @default "stelle"
     */
    defaultPrefix: string;
    /**
     * The prefixes used to use text commands.
     * @type {string[]}
     * @default ["st!"]
     */
    prefixes: string[];
    /**
     * The commands cache file name.
     * @type {string}
     * @default "commands.json"
     */
    filename: `${string}.json`;
}

/**
 * The configuration interface.
 */
export interface StelleConfiguration {
    /**
     * Stelle default locale.
     * @default "en-US"
     * @type {LocaleString}
     */
    defaultLocale: LocaleString;
    /**
     * The colors configuration.
     * @type {Colors}
     */
    color: Colors;
    /**
     * The commands configuration.
     * @type {Commands}
     */
    commands: Commands;
}

/**
 * The environment variables interface.
 */
export interface StelleEnvironment {
    /**
     * The bot token.
     * @type {string}
     */
    Token?: string;
    /**
     * The database URL.
     * @type {string}
     */
    DatabaseUrl?: string;
    /**
     * The errors webhook URL.
     * @type {string}
     */
    ErrorsWebhook?: string;
    /**
     * The Redis host.
     * @type {string}
     */
    RedisHost?: string;
    /**
     * The Redis port.
     * @type {string}
     */
    RedisPort?: string;
    /**
     * The Redis password.
     * @type {string}
     */
    RedisPassword?: string;
}
