import type { LavalinkPlayerVoice, NodeStructure, PlayerStructure, TrackStructure } from "hoshimi";
import { LogLevels, type UsingClient } from "seyfert";

/**
 *
 * The function to make hoshimi handles the players when a node is connected.
 * @param {UsingClient} client The client instance.
 * @param {LavalinkNode} node The Lavalink node instance.
 * @param {PlayerStructure[]} players The list of players to resume.
 * @returns {Promise<void>} Anything, this is a void function.
 */
export async function libraryListener(client: UsingClient, node: NodeStructure, players: PlayerStructure[]): Promise<void> {
    if (client.config.sessions.resumePlayers) {
        client.debug(LogLevels.Debug, `[Lavalink] Node connected | node: ${node.id} | resuming players: ${players.length}`);

        if (players.length && !node.session.resuming) {
            for (const player of players) {
                if (await player.data.get("internal_nodeChange")) continue;

                try {
                    if (!player.isPlaying() && !player.queue.totalSize) {
                        client.debug(
                            LogLevels.Debug,
                            `[Lavalink] Destroying inactive player | node: ${node.id} | guild: ${player.guildId}`,
                        );

                        await player.destroy();

                        return;
                    }

                    const messageId: string | undefined = await player.data.get("messageId");
                    const channelId: string | undefined = player.textId ?? player.options.textId;

                    if (messageId && channelId) await client.messages.delete(messageId, channelId).catch((): null => null);

                    const track: TrackStructure | null = player.queue.current;

                    const voice: LavalinkPlayerVoice | null = player.voice.toNode();
                    if (!voice) {
                        client.debug(LogLevels.Debug, `[Lavalink] Skipping guild ${player.guildId} because voice data is incomplete.`);

                        continue;
                    }

                    await player.updatePlayer({ playerOptions: { voice } });
                    await player.connect();
                    await player.queue.utils.sync({ override: false, syncCurrent: true });

                    if (track)
                        await player.play({
                            track,
                            noReplace: false,
                            position: player.lastPosition,
                            paused: player.paused,
                        });

                    client.debug(LogLevels.Debug, `[Lavalink] Player resumed | node: ${node.id} | guild: ${player.guildId}`);
                } catch (error) {
                    client.logger.error(`[Lavalink] Resume player failed | node: ${node.id} | guild: ${player.guildId} | error: ${error}`);
                }
            }
        }
    }
}
