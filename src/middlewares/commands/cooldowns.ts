import { type AnyContext, type LimitedCollection, type MiddlewareContext, createMiddleware } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { getCollectionKey } from "#stelle/utils/functions/utils.js";

/**
 * The middleware to handle cooldowns.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const cooldownMiddleware: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, next, pass }) => {
    // avoid components for now
    if (context.isComponent()) return next();

    const { client, command } = context;

    const collection: LimitedCollection<string, number> = client.cooldowns;
    const cooldown: number = (command.cooldown ?? 3) * 1000;
    const now: number = Date.now();
    const key: string = getCollectionKey(context);

    const { messages } = await context.getLocale();

    const time: number | undefined = collection.get(key);
    if (time && now < time) {
        context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.inCooldown({ time: Math.floor(time / 1000) }),
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    collection.set(key, now + cooldown, cooldown);

    return next();
});
