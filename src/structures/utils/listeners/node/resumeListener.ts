import type { InvalidLavalinkRestRequest, LavalinkNode, LavalinkPlayer } from "lavalink-client";
import type { UsingClient } from "seyfert";
import type { SessionJson } from "#stelle/types";

import { Constants } from "../../data/constants.js";
import { Sessions } from "../../manager/sessions.js";

/**
 *
 * The listener for the `resumed` event of the Lavalink node.
 * This event is emitted when the Lavalink node is resumed.
 * @param {UsingClient} client The client instance.
 * @param {LavalinkNode} node The Lavalink node instance.
 * @param {LavalinkPlayer[] | InvalidLavalinkRestRequest} players The players that are resumed.
 * @returns {Promise<void>} Whatever, this is a void function.
 */
export async function resumeListener(
    client: UsingClient,
    node: LavalinkNode,
    players: LavalinkPlayer[] | InvalidLavalinkRestRequest,
): Promise<void> {
    if (!client.config.sessions.enabled) return;
    if (!Array.isArray(players)) return;

    for (const data of players) {
        const session: SessionJson | undefined = Sessions.get<SessionJson>(data.guildId);
        if (!session) continue;

        if (!data.state.connected) {
            Sessions.delete(data.guildId);
            continue;
        }

        const player = client.manager.createPlayer({
            guildId: data.guildId,
            volume: data.volume,
            node: node.id,
            voiceChannelId: session.voiceChannelId,
            textChannelId: session.textChannelId,
            selfDeaf: session.options?.selfDeaf,
            selfMute: session.options?.selfMute,
            applyVolumeAsFilter: session.options.applyVolumeAsFilter,
            instaUpdateFiltersFix: session.options.instaUpdateFiltersFix,
            vcRegion: session.options.vcRegion,
        });

        player.set("messageId", session.messageId);
        player.set("enabledAutoplay", session.enabledAutoplay);
        player.set("me", session.me);
        player.set("localeString", session.localeString);
        player.set("lyricsEnabled", session.lyricsEnabled);
        player.set("lyricsId", session.lyricsId);

        player.voice = data.voice;

        await player.connect();

        Object.assign(player.filterManager, { data: data.filters });

        await player.queue.utils.sync(true, false);

        if (data.track) player.queue.current = client.manager.utils.buildTrack(data.track, session.me);

        Object.assign(player, {
            lastPosition: data.state.position,
            lastPositionChange: Date.now(),
            paused: data.paused,
            playing: !data.paused && !!data.track,
            repeatMode: session.repeatMode,
        });

        player.ping.lavalink = data.state.ping;

        if (Constants.Debug) client.debugger?.info(`Node: ${node.id} | Player: ${player.guildId} | Resumed`);
    }
}
