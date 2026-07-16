import type { PlayerStructure } from "hoshimi";
import { type AnyContext, createMiddleware, type DefaultLocale, type MiddlewareContext } from "seyfert";

/**
 * Create a middleware that guards a command based on the guild player state.
 * @param {(player: PlayerStructure) => boolean | Promise<boolean>} check Predicate that returns `true` when the player passes the guard.
 * @param {(messages: DefaultLocale["messages"]) => string} message Locale accessor for the error shown when the guard fails.
 * @returns {MiddlewareContext<void, AnyContext>} The player guard middleware.
 */
const createPlayerGuard = (
    check: (player: PlayerStructure) => boolean | Promise<boolean>,
    message: (messages: DefaultLocale["messages"]) => string,
): MiddlewareContext<void, AnyContext> =>
    createMiddleware<void>(async ({ context, stop, next }) => {
        if (!context.inGuild()) return next();

        const player: PlayerStructure | undefined = context.client.manager.getPlayer(context.guildId);
        if (!player) return stop();

        if (await check(player)) return next();

        const { messages } = await context.locale();
        await context.errorReply(message(messages), { ephemeral: true });

        return stop();
    });

/**
 * Check if the bot is connected to any lavalink node.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkNodes: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, stop, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.locale();
    const { client } = context;

    if (!client.manager.isUsable()) {
        await context.errorReply(messages.events.noNodes, { ephemeral: true });

        return stop();
    }

    return next();
});

/**
 * Check if the player exists and hand it down to the command through the middleware metadata.
 * @type {MiddlewareContext<{ player: PlayerStructure }, AnyContext>}
 */
export const checkPlayer: MiddlewareContext<{ player: PlayerStructure }, AnyContext> = createMiddleware<{ player: PlayerStructure }>(
    async ({ context, stop, next }) => {
        // A player can only exist within a guild.
        if (!context.inGuild()) return stop();

        const player: PlayerStructure | undefined = context.client.manager.getPlayer(context.guildId);
        if (!player) {
            const { messages } = await context.locale();
            await context.errorReply(messages.events.noPlayer, { ephemeral: true });

            return stop();
        }

        return next({ player });
    },
);

/**
 * Check if the queue has tracks (or autoplay is enabled).
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkQueue: MiddlewareContext<void, AnyContext> = createPlayerGuard(
    async (player): Promise<boolean> => !!(await player.data.get("enabledAutoplay")) || player.queue.tracks.length > 0,
    (messages): string => messages.events.noTracks,
);

/**
 * Check if the queue has at least one track (queued or currently playing).
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkTracks: MiddlewareContext<void, AnyContext> = createPlayerGuard(
    (player): boolean => player.queue.totalSize >= 1,
    (messages): string => messages.events.moreTracks,
);
