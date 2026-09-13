import { type LavalinkPlayer, type NodeStructure, StorageError } from "hoshimi";
import { LogLevels, type UsingClient } from "seyfert";
import type { SessionJson } from "#stelle/types";
import { Sessions } from "#stelle/utils/manager/sessions.js";

/**
 *
 * The listener for the `resumed` event of the Lavalink node.
 * This event is emitted when the Lavalink node is resumed.
 * @param {UsingClient} client The client instance.
 * @param {LavalinkNode} node The Lavalink node instance.
 * @param {LavalinkPlayer[]} players The players that are resumed.
 * @returns {Promise<void>} Whatever, this is a void function.
 */
export async function resumeListener(client: UsingClient, node: NodeStructure, players: LavalinkPlayer[]): Promise<void> {
    if (!client.config.sessions.enabled) return;

    for (const data of players) {
        // Resume each guild in isolation: a failure restoring one player must not abort the rest (or crash the process).
        try {
            const session: SessionJson | undefined = Sessions.get<SessionJson>(data.guildId);
            if (!session) continue;

            // If the node is not connected and the session is not 24/7, delete the session and skip to the next player.
            if (!data.state.connected && !session.is247) {
                Sessions.delete(data.guildId);
                continue;
            }

            const player = client.manager.createPlayer({
                ...session.options,
                guildId: data.guildId,
                volume: data.volume,
                node: node.id,
            });

            if (session.messageId) await player.data.set("messageId", session.messageId);
            if (session.enabledAutoplay) await player.data.set("enabledAutoplay", session.enabledAutoplay);
            if (session.me) await player.data.set("me", session.me);
            if (session.localeString) await player.data.set("localeString", session.localeString);
            if (session.lyricsId) await player.data.set("lyricsId", session.lyricsId);
            if (session.lyricsEnabled) await player.data.set("lyricsEnabled", session.lyricsEnabled);
            if (session.is247) await player.data.set("is247", session.is247);
            if (session.isAutoPause) await player.data.set("isAutoPause", session.isAutoPause);
            if (session.isRequestChannel) await player.data.set("isRequestChannel", session.isRequestChannel);

            player.voice.patch({ ...data.voice });

            await player.connect();

            Object.assign(player.filterManager, { data: data.filters });

            // An idle player (e.g. a 24/7 bot with no queue) has no stored queue to sync: hoshimi throws a
            // StorageError in that case, which is expected here. Anything else is logged to the debugger rather than
            // aborting the rest of this player's resume.
            await player.queue.utils.sync({ override: true, syncCurrent: false }).catch((error: unknown): void => {
                if (!(error instanceof StorageError))
                    client.debug(LogLevels.Error, `[Lavalink] Queue sync failed | guild: ${player.guildId} | error: ${error}`);
            });

            if (data.track) player.queue.current = await player.queue.utils.build(data.track, session.me);

            Object.assign(player, {
                lastPosition: data.state.position,
                lastPositionChange: Date.now(),
                paused: data.paused,
                playing: !data.paused && !!data.track,
                loop: session.loop,
            });

            client.debug(LogLevels.Debug, `[Lavalink] Player resumed | node: ${node.id} | guild: ${player.guildId}`);
        } catch (error) {
            client.logger.error(`[Lavalink] Resume failed | node: ${node.id} | guild: ${data.guildId} | error: ${error}`);
        }
    }
}
