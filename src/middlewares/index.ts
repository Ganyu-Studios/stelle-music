import { checkCooldown } from "./commands/cooldown.js";
import { checkVerifications } from "./commands/verifications.js";

import { checkNodes, checkPlayer, checkQueue, checkTracks } from "./commands/manager.js";
import { checkBotVoiceChannel, checkVoiceChannel, checkVoicePermissions } from "./commands/voice.js";

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
