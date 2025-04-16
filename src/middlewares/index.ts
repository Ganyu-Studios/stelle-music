import { checkCooldown } from "./commands/cooldowns.js";
import { checkVerifications } from "./commands/verifications.js";
import { checkNodes, checkPlayer, checkQueue, checkTracks } from "./manager/internal.js";
import { checkBotVoiceChannel, checkVoiceChannel, checkVoicePermissions } from "./manager/voice.js";

/**
 * The middlewares of the client.
 */
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
    checkVoicePermissions,
} as const;
