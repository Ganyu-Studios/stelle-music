import { Logger } from "seyfert";
import { LogLevels } from "seyfert/lib/common/index.js";

import { Configuration } from "./data/Configuration.js";

import chalk, { type ChalkInstance } from "chalk";
import { convertToHEX } from "./functions/utils.js";

const customColor = convertToHEX(Configuration.color.success);

/**
 *
 * Add padding to the label.
 * @param label
 * @returns
 */
function addPadding(label: string): string {
    const maxLength = 6;
    const bar = "|";

    const spacesToAdd = maxLength - label.length;
    if (spacesToAdd <= 0) return bar;

    const spaces = " ".repeat(spacesToAdd);

    return spaces + bar;
}

/**
 * Formats memory usage data into a string.
 * @param data The memory usage data.
 * @returns
 */
function formatMemoryUsage(bytes: number): string {
    const gigaBytes = bytes / 1024 ** 3;
    if (gigaBytes >= 1) return `[RAM: ${gigaBytes.toFixed(3)} GB]`;

    const megaBytes = bytes / 1024 ** 2;
    if (megaBytes >= 1) return `[RAM: ${megaBytes.toFixed(2)} MB]`;

    const kiloBytes = bytes / 1024;
    if (kiloBytes >= 1) return `[RAM: ${kiloBytes.toFixed(2)} KB]`;

    return `[RAM: ${bytes.toFixed(2)} B]`;
}

/**
 *
 * Send ascii text.
 * @returns
 */
export function getWatermark(): void {
    return console.info(
        chalk.hex(customColor)(`


        ███████╗████████╗███████╗██╗     ██╗     ███████╗
        ██╔════╝╚══██╔══╝██╔════╝██║     ██║     ██╔════╝
        ███████╗   ██║   █████╗  ██║     ██║     █████╗  
        ╚════██║   ██║   ██╔══╝  ██║     ██║     ██╔══╝  
        ███████║   ██║   ███████╗███████╗███████╗███████╗
        ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚══════╝
														   
		
		   ${chalk.italic(`→   ${getRandomText()}`)}
    `),
    );
}

/**
 *
 * Get a random text to make it more lively...?
 * @returns
 */
function getRandomText(): string {
    const texts = [
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

/**
 *
 * Customize the Logger.
 * @param _this
 * @param level
 * @param args
 * @returns
 */
export function customLogger(_this: Logger, level: LogLevels, args: unknown[]): unknown[] {
    const date: Date = new Date();
    const memory: NodeJS.MemoryUsage = process.memoryUsage();

    const label: string = Logger.prefixes.get(level) ?? "---";
    const timeFormat: string = `[${date.toLocaleDateString()} : ${date.toLocaleTimeString()}]`;

    const emojis: Record<LogLevels, string> = {
        [LogLevels.Debug]: "🎩",
        [LogLevels.Error]: "🏮",
        [LogLevels.Info]: "📘",
        [LogLevels.Warn]: "🔰",
        [LogLevels.Fatal]: "💀",
    };

    const colors: Record<LogLevels, ChalkInstance> = {
        [LogLevels.Debug]: chalk.grey,
        [LogLevels.Error]: chalk.red,
        [LogLevels.Info]: chalk.hex(customColor),
        [LogLevels.Warn]: chalk.yellow,
        [LogLevels.Fatal]: chalk.red,
    };

    const text = `${chalk.grey(`${timeFormat}`)} ${chalk.grey(formatMemoryUsage(memory.rss))} ${emojis[level]} [${colors[level](
        label,
    )}] ${addPadding(label)}`;

    return [text, ...args];
}
