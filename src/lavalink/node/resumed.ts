import { Lavalink, sessions } from "#stelle/classes";
import type { StellePlayerJson } from "#stelle/types";

export default new Lavalink({
    name: "resumed",
    type: "node",
    run: async (client, node, _, players) => {
        if (!client.config.sessions.enabled) return;
        if (!Array.isArray(players)) return;

        for (const data of players) {
            const session = sessions.get<StellePlayerJson>(data.guildId);
            if (!session) continue;

            if (!data.state.connected) {
                sessions.delete(data.guildId);
                continue;
            }

            if (data.state.connected) {
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

                if (data.track) player.queue.current = client.manager.utils.buildTrack(data.track, session.me);

                if (!player.queue.previous.length) player.queue.previous.unshift(...session.queue!.previous);
                if (!player.queue.tracks.length) player.queue.add(session.queue!.tracks);

                Object.assign(player, {
                    lastPosition: data.state.position,
                    lastPositionChange: Date.now(),
                    paused: data.paused,
                    playing: !data.paused && !!data.track,
                    repeatMode: session.repeatMode,
                });

                player.ping.lavalink = data.state.ping;

                await player.queue.utils.save();
            } else {
                sessions.delete(data.guildId);
            }
        }
    },
});
