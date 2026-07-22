import { Logger } from "seyfert";
import { gray, italic, LogLevels, red, rgb24, yellow } from "seyfert/lib/common/index.js";

import { Configuration } from "#stelle/utils/data/configuration.js";

/**
 * The color function type used for coloring log messages.
 */
type ColorFunction = (text: string) => string;

/**
 *
 * The custom color function for log messages, using the success color from the configuration.
 * @param {string} text The text to color.
 * @returns {string} The colored text.
 */
const customColor: ColorFunction = (text: string): string => rgb24(text, Configuration.color.success);

/**
 *
 * Set padding for log message labels to ensure consistent formatting.
 * @param {string} label The label to pad.
 * @returns {string} The padded label with a bar.
 */
function setPadding(label: string): string {
    const maxLength = 6;
    const bar = "|";

    const spacesToAdd: number = maxLength - label.length;
    if (spacesToAdd <= 0) return bar;

    const spaces: string = " ".repeat(spacesToAdd);

    return spaces + bar;
}

/**
 *
 * Get a random text from a predefined list of texts for logging purposes.
 * @returns {string} A random text from the list.
 */
function getRandomText(): string {
    const texts: string[] = [
        "Traveling~",
        "Trailblazing with Stelle!",
        "Warp-speed help, Stelle-style!",
        "Stelle's starry aid!",
        "Galaxy-grade support!",
        "Astral assistance, Stelle touch!",
        "Stellar aid on the rail!",
        "Cosmic help from Stelle!",
        "Warp to help with Stelle!",
        "Stelle's cosmic boost!",
        "Star Rail swift support!",
        "Galaxy's best aid!",
        "Stelle's interstellar help!",
        "Light-speed support!",
        "Astral aid with Stelle!",
        "Support from the stars!",
        "Stelle's nebula assist!",
        "Celestial help, Stelle way!",
        "Galaxy express support!",
        "Stelle's space-age aid!",
        "Support across the stars!",
        "Stelle's comet-like help!",
        "Universal support, Stelle style!",
        "Honkai help, Stelle flair!",
        "Spacefaring aid from Stelle!",
        "Astral support express!",
        "Stelle's cosmic care!",
        "Support on the Honkai rails!",
        "Stelle's starship aid!",
        "Galactic help, Stelle touch!",
        "Help from the cosmos!",
    ];

    return texts[Math.floor(Math.random() * texts.length)];
}

export const LoggerOps = {
    /**
     *
     * Format memory usage in bytes to a human-readable string with appropriate units.
     * @param {number} bytes The memory usage in bytes.
     * @returns {string} The formatted memory usage string.
     */
    memoryUsage(bytes: number): string {
        const units: string[] = ["B", "KB", "MB", "GB", "TB"];
        let i: number = 0;

        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }

        return `${bytes.toFixed(2)} ${units[i]}`;
    },
    /**
     *
     * Log a watermark message to the console with a custom design and a random text.
     * @returns {void} This function does not return a value.
     */
    watermark(): void {
        console.info(
            customColor(`

        ███████╗████████╗███████╗██╗     ██╗     ███████╗
        ██╔════╝╚══██╔══╝██╔════╝██║     ██║     ██╔════╝
        ███████╗   ██║   █████╗  ██║     ██║     █████╗  
        ╚════██║   ██║   ██╔══╝  ██║     ██║     ██╔══╝  
        ███████║   ██║   ███████╗███████╗███████╗███████╗
        ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚══════╝
													   
		
		   ${italic(`→   ${getRandomText()}`)}
    `),
        );
    },
    /**
     *
     * Custom log formatting for different log levels, including timestamp, memory usage, and emojis.
     * @param {Logger} _this The logger instance.
     * @param {LogLevels} level The log level (Debug, Error, Info, Warn, Fatal).
     * @param {unknown[]} args The arguments to log.
     * @returns {unknown[]} The formatted log message and arguments.
     */
    custom(_this: Logger, level: LogLevels, args: unknown[]): unknown[] {
        const date: Date = new Date();
        const memory: NodeJS.MemoryUsage = process.memoryUsage();

        const label: string = Logger.prefixes.get(level) ?? "UNKNOWN";
        const timeFormat: string = `[${date.toLocaleDateString()} : ${date.toLocaleTimeString()}]`;

        const emojis: Record<LogLevels, string> = {
            [LogLevels.Debug]: "🎩",
            [LogLevels.Error]: "🏮",
            [LogLevels.Info]: "📘",
            [LogLevels.Warn]: "🔰",
            [LogLevels.Fatal]: "💀",
        };

        const colors: Record<LogLevels, ColorFunction> = {
            [LogLevels.Debug]: gray,
            [LogLevels.Error]: red,
            [LogLevels.Info]: customColor,
            [LogLevels.Warn]: yellow,
            [LogLevels.Fatal]: red,
        };

        const text = `${gray(`${timeFormat}`)} ${gray(`[RAM: ${LoggerOps.memoryUsage(memory.rss)}]`)} ${emojis[level]} [${colors[level](
            label,
        )}] ${setPadding(label)}`;

        return [text, ...args];
    },
    /**
     *
     * Create a new logger instance with a specified name, enabling file saving and active logging.
     * @param {string} name The name of the logger instance.
     * @returns {Logger} A new logger instance with the specified name.
     */
    create(name: string): Logger {
        return new Logger({ name, saveOnFile: true, active: true });
    },
};

/**
 *
 * The logger instance used in log messages.
 * @type {Logger} The logger instance.
 */
export const logger: Logger = LoggerOps.create("[Stelle]");
