import type { Options } from "#stelle/types";

export function StelleOptions(options: Options) {
    return <T extends { new (...args: any[]): {} }>(target: T) =>
        class extends target {
            cooldown = options.cooldown;
            onlyDeveloper = options.onlyDeveloper;
            onlyGuildOwner = options.onlyGuildOwner;
            inVoice = options.inVoice;
            sameVoice = options.sameVoice;
            checkNodes = options.checkNodes;
            checkPlayer = options.checkPlayer;
            checkQueue = options.checkQueue;
        };
}
