import type { LavalinkNode, Player } from "lavalink-client";
import type { UsingClient } from "seyfert";

/**
 *
 * The listener for the `connected` event of the Lavalink node.
 * @param {UsingClient} client The client instance.
 * @param {LavalinkNode} node The Lavalink node instance.
 * @returns {Promise<void>} Anything, this is a void function.
 */
export async function connectListener(client: UsingClient, node: LavalinkNode): Promise<void> {
    if (client.config.sessions.resumePlayers) {
        const players: Player[] = [...client.manager.players.values()].filter((player): boolean => player.node.id === node.id);
        if (players.length && !node.resuming.enabled) {
            for (const player of players) {
                try {
                    const messageId = player.get<string | undefined>("messageId");
                    const channelId = player.textChannelId ?? player.options.textChannelId;

                    if (messageId && channelId) await client.messages.delete(channelId, messageId);

                    await player.play({
                        track: { encoded: player.queue.current?.encoded },
                        paused: player.paused,
                        volume: player.volume,
                        position: player.position,
                        voice: player.voice,
                    });

                    await player.queue.utils.sync(false, true);
                } catch (error) {
                    client.logger.error(`Lavalink - Error resuming the player: ${player.guildId} ${error}`);
                }
            }
        }
    }
}
