import { checkCooldown } from "./commands/cooldown.js";
import { checkVerifications } from "./commands/verifications.js";

export const StelleMiddlewares = {
    checkCooldown,
    checkVerifications,
} as const;
