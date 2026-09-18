import { checkCooldown } from "#stelle/middlewares/commands/cooldowns.js";
import { checkVerifications } from "#stelle/middlewares/commands/verifications.js";
import { checkActivePlayer, checkNodes, checkPlayer, checkQueue, checkTracks } from "#stelle/middlewares/manager/internal.js";
import { checkBotVoiceChannel, checkVoiceChannel, checkVoicePermissions } from "#stelle/middlewares/manager/voice.js";

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
    checkActivePlayer,

    // Permissions middlewares
    checkVoicePermissions,
} as const;
