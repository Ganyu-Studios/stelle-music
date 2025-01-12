import { Lavalink } from "#stelle/classes";
import type { StellePlayerJson } from "#stelle/types";

export default new Lavalink({
    name: "resumed",
    type: "node",
    async run(client, node, _, players): Promise<void> {
        if (!client.config.sessions.enabled) return;
        if (!Array.isArray(players)) return;

        for (const data of players) {
            const session = client.sessions.get<StellePlayerJson>(data.guildId);
            if (!session) continue;

            if (!data.state.connected) {
                client.sessions.delete(data.guildId);
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
        }
    },
});
