import { Lavalink, sessions } from "#stelle/classes";
import type { StellePlayerJson } from "#stelle/types";

export default new Lavalink({
    name: "resumed",
    type: "node",
    run: async (client, node, _, players) => {
        if (!Array.isArray(players)) return;

        for (const data of players) {
            const session = sessions.get<StellePlayerJson>(data.guildId);
            if (!session) continue;

            if (data.state.connected) {
                const player = client.manager.createPlayer({
                    guildId: data.guildId,
                    voiceChannelId: session.voiceChannelId,
                    textChannelId: session.textChannelId,
                    selfDeaf: session.options?.selfDeaf,
                    selfMute: session.options?.selfMute,
                    volume: client.manager.options.playerOptions?.volumeDecrementer
                        ? Math.round(data.volume / client.manager.options.playerOptions.volumeDecrementer)
                        : data.volume,
                    node: node.id,
                    applyVolumeAsFilter: session.options.applyVolumeAsFilter,
                    instaUpdateFiltersFix: session.options.instaUpdateFiltersFix,
                    vcRegion: session.options.vcRegion,
                });

                if (!player.get("messageId")) player.set("messageId", session.messageId);
                if (!player.get("enabledAutoplay")) player.set("enabledAutoplay", session.enabledAutoplay);
                if (!player.get("me")) player.set("me", session.me);
                if (!player.get("localeString")) player.set("localeString", session.localeString);

                await player.connect();

                player.filterManager.data = data.filters;

                if (data.track) player.queue.current = client.manager.utils.buildTrack(data.track, session.me);

                if (!player.queue.previous.length) player.queue.previous.unshift(...session.queue!.previous);
                if (!player.queue.tracks.length) player.queue.add(session.queue!.tracks);

                player.lastPosition = data.state.position;
                player.lastPositionChange = Date.now();
                player.ping.lavalink = data.state.ping;

                player.paused = data.paused;
                player.playing = !data.paused && !!data.track;

                await player.queue.utils.save();
            } else {
                sessions.delete(data.guildId);
            }
        }
    },
});
