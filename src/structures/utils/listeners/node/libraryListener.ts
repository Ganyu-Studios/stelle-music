import type { LavalinkPlayerVoice, NodeStructure, PlayerStructure, TrackStructure } from "hoshimi";
import { type AllGuildVoiceChannels, type GuildMember, LogLevels, type UsingClient } from "seyfert";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { joinVoiceChannel } from "#stelle/utils/functions/manager/voice.js";

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

                        continue;
                    }

                    const messageId: string | undefined = await player.data.get("messageId");
                    const channelId: string | undefined = player.textId ?? player.options.textId;

                    if (messageId && channelId) await client.messages.delete(messageId, channelId).catch((): null => null);

                    // The node lost the player, so the track below is replayed from a fresh node player: with its old
                    // now-playing message deleted, that start has to be announced again.
                    if (await player.data.delete("announcedTrack"))
                        client.debug(LogLevels.Debug, `[Lavalink] Announced track released | node: ${node.id} | guild: ${player.guildId}`);

                    const track: TrackStructure | null = player.queue.current;

                    const voice: LavalinkPlayerVoice | null = player.voice.toNode();
                    if (!voice) {
                        client.debug(LogLevels.Debug, `[Lavalink] Skipping guild ${player.guildId} because voice data is incomplete.`);

                        continue;
                    }

                    await player.updatePlayer({ playerOptions: { voice } });
                    await player.connect();

                    // Same as `resumeListener`: a re-resumed player never sends a fresh join, so no voice-state
                    // event can repair a bot left as a suppressed audience in a stage channel — do it directly.
                    const me: GuildMember | null = await client.members.fetch(player.guildId, client.botId).catch((): null => null);
                    const voiceChannel: AllGuildVoiceChannels | null = await PlayerOps.voice(
                        client,
                        player.voiceId ?? player.options.voiceId,
                    );
                    if (me && voiceChannel) await joinVoiceChannel(player, voiceChannel, me);

                    // No queue sync here: this process never lost the player, so its in-memory queue is the source of
                    // truth and the stored one is a copy of it. Merging the stored tracks back in (`override: false`)
                    // appended that copy on every node reconnect, doubling the queue each time.
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
