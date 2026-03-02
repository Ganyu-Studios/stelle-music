import type { LavalinkPlayerVoice, NodeStructure, PlayerStructure } from "hoshimi";
import type { UsingClient } from "seyfert";
import { Constants } from "#stelle/utils/data/constants.js";

/**
 *
 * The listener for the `connected` event of the Lavalink node.
 * This event is emitted when the Lavalink node is connected.
 * @param {UsingClient} client The client instance.
 * @param {LavalinkNode} node The Lavalink node instance.
 * @returns {Promise<void>} Anything, this is a void function.
 */
export async function connectListener(client: UsingClient, node: NodeStructure): Promise<void> {
    if (client.config.sessions.resumePlayers) {
        const players: PlayerStructure[] = [...client.manager.players.values()].filter((player): boolean => player.node.id === node.id);
        if (players.length && !node.session.resuming) {
            for (const player of players) {
                try {
                    if (!player.playing && !player.paused && !(player.queue.tracks.length + Number(!!player.queue.current))) {
                        if (Constants.Debug) client.debugger?.info(`Lavalink - Player destroyed: ${player.guildId} on node ${node.id}.`);

                        await player.destroy();

                        return;
                    }

                    const messageId = await player.data.get("messageId");
                    const channelId = player.textId ?? player.options.textId;

                    if (messageId && channelId) await client.messages.delete(messageId, channelId).catch((): null => null);

                    const track = player.queue.current;

                    await player.node.updatePlayer({
                        guildId: player.guildId,
                        playerOptions: { voice: player.voice as LavalinkPlayerVoice },
                    });

                    await player.connect();
                    await player.queue.utils.sync(false, true);

                    if (track)
                        await player.play({
                            track,
                            noReplace: false,
                            position: player.lastPosition,
                            paused: player.paused,
                        });

                    if (Constants.Debug) client.debugger?.info(`Lavalink - Player resumed: ${player.guildId} on node ${node.id}.`);
                } catch (error) {
                    client.logger.error(`Lavalink - Error resuming the player: ${player.guildId} ${error}`);
                }
            }
        }
    }
}
