import { type AnyContext, createMiddleware, type LimitedCollection, type MiddlewareContext } from "seyfert";

import { UtilsOps } from "#stelle/utils/functions/internal/utils.js";

/**
 * The middleware to handle cooldowns.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkCooldown: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, next, stop }) => {
    // avoid components for now
    // this will make someone happy
    if (context.isComponent()) return next();

    const { client, command } = context;

    const collection: LimitedCollection<string, number> = client.cooldowns;
    const cooldown: number = (command.cooldown ?? 3) * 1000;
    const now: number = Date.now();
    const key: string = UtilsOps.collectionKey(context);

    const { messages } = await context.locale();

    const time: number | undefined = collection.get(key);
    if (time && now < time) {
        context.errorReply(messages.events.inCooldown({ time: Math.floor(time / 1000) }), { ephemeral: true });

        return stop();
    }

    collection.set(key, now + cooldown, cooldown);

    return next();
});
