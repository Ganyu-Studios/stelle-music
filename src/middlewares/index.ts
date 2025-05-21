import { checkCooldown } from "./commands/cooldowns.js";
import { checkVerifications } from "./commands/verifications.js";
import { checkNodes, checkPlayer, checkQueue, checkTracks } from "./manager/internal.js";
import { checkBotVoiceChannel, checkVoiceChannel, checkVoicePermissions } from "./manager/voice.js";

/**
 * The global middlewares of the client.
 */
export const GlobalMiddlewares = {
    // Main middlewares
    checkCooldown,
    checkVerifications,
} as const;

/**
 * The middlewares of the client.
 */
export const StelleMiddlewares = {
    // Main middlewares
    ...GlobalMiddlewares,

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
