import { cooldownMiddleware } from "./commands/cooldowns.js";

/**
 * The middlewares of the client.
 */
export const StelleMiddlewares = {
    cooldownMiddleware,
} as const;
