import { checkCooldown } from "./commands/cooldown.js";
import { checkMusic } from "./commands/player.js";
import { checkVerifications } from "./commands/verifications.js";
import { checkVoice } from "./commands/voice.js";

export const StelleMiddlewares = {
    checkCooldown,
    checkVerifications,
    checkMusic,
    checkVoice,
};
