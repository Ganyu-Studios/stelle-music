import { type AnyContext, type MiddlewareContext, createMiddleware } from "seyfert";
import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";

/**
 * Check if the bot is connected to any lavalink node.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkNodes: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { messages } = await context.getLocale();
    const { client } = context;

    if (!client.manager.useable) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noNodes,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});

/**
 * Check if the player exists.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkPlayer: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { client } = context;
    const { messages } = await context.getLocale();

    const player = client.manager.getPlayer(context.guildId);
    if (!player) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noPlayer,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});

/**
 * Check if the queue has tracks.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkQueue: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { client } = context;
    const { messages } = await context.getLocale();

    const player = client.manager.getPlayer(context.guildId);
    if (!player) return pass();

    const isAutoplay = !!player.get<boolean | undefined>("enabledAutoplay");
    if (!(isAutoplay || player.queue.tracks.length)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});

/**
 * Check if the queue has more than one track.
 * @type {MiddlewareContext<void, AnyContext>}
 */
export const checkTracks: MiddlewareContext<void, AnyContext> = createMiddleware<void>(async ({ context, pass, next }) => {
    if (!context.inGuild()) return next();

    const { client } = context;
    const { messages } = await context.getLocale();

    const player = client.manager.getPlayer(context.guildId);
    if (!player) return pass();

    if (!(player.queue.tracks.length + Number(!!player.queue.current) >= 1)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.moreTracks,
                    color: EmbedColors.Red,
                },
            ],
        });

        return pass();
    }

    return next();
});
