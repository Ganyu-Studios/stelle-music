import { EmbedColors } from "seyfert/lib/common/index.js";
import { MessageFlags } from "seyfert/lib/types/index.js";
import { createMiddleware } from "seyfert";

/**
 * Check if the bot is connected to any lavalink node.
 */
export const checkNodes = createMiddleware<void>(async ({ context, pass, next }) => {
    const { messages } = await context.getLocale();
    const { client } = context;

    if (!client.manager.useable) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noNodes,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    next();
});

/**
 * Check if the player exists.
 */
export const checkPlayer = createMiddleware<void>(async ({ context, pass, next }) => {
    const { client } = context;
    const { messages } = await context.getLocale();

    if (!context.guildId) {
        pass(); return;
    }

    const player = client.manager.getPlayer(context.guildId);
    if (!player) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noPlayer,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    next();
});

/**
 * Check if the queue has tracks.
 */
export const checkQueue = createMiddleware<void>(async ({ context, pass, next }) => {
    const { client } = context;
    const { messages } = await context.getLocale();

    if (!context.guildId) {
        pass(); return;
    }

    const player = client.manager.getPlayer(context.guildId);
    if (!player) {
        pass(); return;
    }

    const isAutoplay = Boolean(player.get<undefined | boolean>("enabledAutoplay"));
    if (!(isAutoplay || player.queue.tracks.length)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.noTracks,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    next();
});

/**
 * Check if the queue has more than one track.
 */
export const checkTracks = createMiddleware<void>(async ({ context, pass, next }) => {
    const { client } = context;
    const { messages } = await context.getLocale();

    if (!context.guildId) {
        pass(); return;
    }

    const player = client.manager.getPlayer(context.guildId);
    if (!player) {
        pass(); return;
    }

    if (!(player.queue.tracks.length + Number(Boolean(player.queue.current)) >= 1)) {
        await context.editOrReply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                {
                    description: messages.events.moreTracks,
                    color: EmbedColors.Red
                }
            ]
        });

        pass(); return;
    }

    next();
});
