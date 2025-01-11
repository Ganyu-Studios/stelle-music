import { checkVoicePermissions, checkBotVoiceChannel, checkVoiceChannel } from "./commands/voice.js";
import { checkPlayer, checkTracks, checkNodes, checkQueue } from "./commands/manager.js";
import { checkVerifications } from "./commands/verifications.js";
import { checkCooldown } from "./commands/cooldown.js";

export const StelleMiddlewares = {
    // Main middlewares
    checkCooldown,
    checkVerifications,

    // Voice middlewares
    checkBotVoiceChannel,
    checkVoiceChannel,

    // Manager middlewares
    checkQueue,
    checkNodes,
    checkPlayer,
    checkTracks,

    // Permissions middlewares
    checkVoicePermissions
} as const;
