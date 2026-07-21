import { Logger } from "seyfert";
import { gray, italic, LogLevels, red, rgb24, yellow } from "seyfert/lib/common/index.js";

import { Configuration } from "#stelle/utils/data/configuration.js";

type ColorFunction = (text: string) => string;

const customColor: ColorFunction = (text: string): string => rgb24(text, Configuration.color.success);

function setPadding(label: string): string {
    const maxLength = 6;
    const bar = "|";

    const spacesToAdd: number = maxLength - label.length;
    if (spacesToAdd <= 0) return bar;

    const spaces: string = " ".repeat(spacesToAdd);

    return spaces + bar;
}

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
    memoryUsage(bytes: number): string {
        const units: string[] = ["B", "KB", "MB", "GB", "TB"];
        let i: number = 0;

        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }

        return `${bytes.toFixed(2)} ${units[i]}`;
    },

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

    create(name: string): Logger {
        return new Logger({ name, saveOnFile: true, active: true });
    },
};

export const logger: Logger = LoggerOps.create("[Stelle]");
