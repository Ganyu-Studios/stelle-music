import type { Command } from "seyfert";
import type { Options } from "#stelle/types";

export function StelleOptions(options: Options) {
    return <T extends { new (...args: any[]): Command }>(target: T) =>
        class extends target {
            cooldown = options.cooldown;
            onlyDeveloper = options.onlyDeveloper;
            onlyGuildOwner = options.onlyDeveloper;
            inVoice = options.inVoice;
            sameVoice = options.sameVoice;
        };
}
