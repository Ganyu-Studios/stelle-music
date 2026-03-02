import type { LavalinkPlayer, NodeStructure } from "hoshimi";
import type { UsingClient } from "seyfert";
import type { SessionJson } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
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
            voiceId: session.voiceId!,
            textId: session.textId!,
            selfDeaf: session.options?.selfDeaf,
            selfMute: session.options?.selfMute,
        });

        await player.data.set("messageId", session.messageId!);
        await player.data.set("enabledAutoplay", session.enabledAutoplay!);
        await player.data.set("me", session.me!);
        await player.data.set("localeString", session.localeString!);
        await player.data.set("lyricsId", session.lyricsId!);
        await player.data.set("lyricsEnabled", session.lyricsEnabled!);
        await player.data.set("is247", session.is247!);
        await player.data.set("isAutoPause", session.isAutoPause!);

        player.voice = data.voice;

        await player.connect();

        Object.assign(player.filterManager, { data: data.filters });

        await player.queue.utils.sync(true, false);

        if (data.track) player.queue.current = await player.queue.build(data.track, session.me!);

        Object.assign(player, {
            lastPosition: data.state.position,
            lastPositionChange: Date.now(),
            paused: data.paused,
            playing: !data.paused && !!data.track,
            loop: session.loop,
        });

        if (Constants.Debug) client.debugger?.info(`Node: ${node.id} | Player: ${player.guildId} | Resumed`);
    }
}
