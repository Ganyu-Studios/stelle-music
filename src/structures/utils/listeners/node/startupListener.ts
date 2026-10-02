import { type NodeStructure, StorageError } from "hoshimi";
import { LogLevels, type UsingClient } from "seyfert";
import type { SessionJson } from "#stelle/types/index.js";
import { PlayerOps } from "#stelle/utils/functions/manager/player.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

/**
 *
 * Cold-start restore: re-join and resume 24/7 players from their persisted sessions when a node first becomes ready.
 *
 * The in-process resume (`resumeListener`/`libraryListener`) only brings back players Lavalink still holds, which lasts
 * `sessions.resumeTime` seconds — nothing survives a full bot restart. This reads the MeowDB sessions directly and
 * rebuilds each 24/7 player from scratch (fresh voice connect, queue synced from Redis), so the bot returns to the same
 * voice channel even after hours of downtime.
 * @param {UsingClient} client The client instance.
 * @param {NodeStructure} node The node that just became ready.
 * @returns {Promise<void>} A promise that resolves once every eligible session has been handled.
 */
export async function startupListener(client: UsingClient, node: NodeStructure): Promise<void> {
    if (!client.config.sessions.enabled) return;

    for (const session of Sessions.values<SessionJson>()) {
        // Only 24/7 players are meant to persist across restarts, and only on the node they belonged to.
        if (!session.is247 || session.node.id !== node.id) continue;

        // Prune sessions older than the max age, and skip ones already live (brought back by the in-process resume).
        if (session.savedAt && Date.now() - session.savedAt > client.config.sessions.maxResumeAge) {
            Sessions.delete(session.guildId);
            continue;
        }

        if (client.manager.getPlayer(session.guildId)) continue;

        // The voice channel may be gone (deleted, or the bot was removed from the guild): prune the session instead of
        // failing a connect against a dead channel on every startup.
        const voice = await PlayerOps.resolveVoiceChannel(client, session.options.voiceId);
        if (!voice) {
            client.logger.warn(`[Lavalink] Skipping 24/7 restore | guild: ${session.guildId} | reason: voice channel unavailable`);
            Sessions.delete(session.guildId);

            continue;
        }

        // Restore each guild in isolation: one failure (missing perms, node hiccup) must not abort the rest.
        try {
            const player = client.manager.createPlayer({ ...session.options, node: node.id, volume: session.volume });

            if (session.messageId) await player.data.set("messageId", session.messageId);
            if (session.enabledAutoplay) await player.data.set("enabledAutoplay", session.enabledAutoplay);
            if (session.me) await player.data.set("me", session.me);
            if (session.localeString) await player.data.set("localeString", session.localeString);
            if (session.lyricsId) await player.data.set("lyricsId", session.lyricsId);
            if (session.lyricsEnabled) await player.data.set("lyricsEnabled", session.lyricsEnabled);
            if (session.is247) await player.data.set("is247", session.is247);
            if (session.isAutoPause) await player.data.set("isAutoPause", session.isAutoPause);
            if (session.isRequestChannel) await player.data.set("isRequestChannel", session.isRequestChannel);

            await player.connect();

            // Load the queue from Redis. An idle 24/7 player has no stored queue (StorageError) — expected here.
            await player.queue.utils.sync({ override: true, syncCurrent: true }).catch((error: unknown): void => {
                if (!(error instanceof StorageError))
                    client.debug(LogLevels.Error, `[Lavalink] Startup queue sync failed | guild: ${player.guildId} | error: ${error}`);
            });

            Object.assign(player, { loop: session.loop });

            // Lavalink forgot everything over the downtime, so start playback ourselves (from the track start — the
            // stored position is meaningless after hours). A connected-but-idle 24/7 player just waits for a request.
            if (player.queue.current) await player.play({ track: player.queue.current });
            else if (player.queue.tracks.length) await player.play();

            client.debug(LogLevels.Debug, `[Lavalink] Session restored on startup | node: ${node.id} | guild: ${player.guildId}`);
        } catch (error) {
            client.logger.error(`[Lavalink] Startup restore failed | node: ${node.id} | guild: ${session.guildId} | error: ${error}`);
        }
    }
}
