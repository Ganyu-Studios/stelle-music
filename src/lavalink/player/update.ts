import type { ClientUser } from "seyfert";
import { Lavalink } from "#stelle/classes";
import { LavalinkEventTypes, type StellePlayerJson } from "#stelle/types";

import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "playerUpdate",
    type: LavalinkEventTypes.Manager,
    run(client, oldPlayer, newPlayer): void {
        if (!client.config.sessions.enabled) return;

        const newPlayerJson = newPlayer.toJSON();

        if (
            !oldPlayer ||
            oldPlayer.voiceChannelId !== newPlayerJson.voiceChannelId ||
            oldPlayer.textChannelId !== newPlayerJson.textChannelId ||
            oldPlayer.options.selfDeaf !== newPlayerJson.options.selfDeaf ||
            oldPlayer.options.selfMute !== newPlayerJson.options.selfDeaf ||
            oldPlayer.nodeId !== newPlayerJson.nodeId ||
            oldPlayer.nodeSessionId !== newPlayerJson.nodeSessionId ||
            oldPlayer.options.applyVolumeAsFilter !== newPlayerJson.options.applyVolumeAsFilter ||
            oldPlayer.options.instaUpdateFiltersFix !== newPlayerJson.options.instaUpdateFiltersFix ||
            oldPlayer.options.vcRegion !== newPlayerJson.options.vcRegion
        ) {
            if (newPlayerJson.queue?.current) newPlayerJson.queue.current.userData = {};

            // yeah, we don't need specific data from the new player json.
            // but I hate the way of destructuring the object...
            const {
                ping: _p,
                createdTimeStamp: _cts,
                lavalinkVolume: _lv,
                equalizer: _eq,
                lastPositionChange: _lpc,
                paused: _pd,
                playing: _pg,
                queue: _q,
                filters: _f,
                ...newJson
            } = newPlayerJson;

            client.sessions.set<StellePlayerJson>(newPlayer.guildId, {
                ...newJson,
                messageId: newPlayer.get("messageId"),
                enabledAutoplay: newPlayer.get("enabledAutoplay"),
                localeString: newPlayer.get<string | undefined>("localeString"),
                me: newPlayer.get<ClientUser | undefined>("me"),
                lyricsId: newPlayer.get<string | undefined>("lyricsId"),
                lyricsEnabled: newPlayer.get<boolean | undefined>("lyricsEnabled"),
            });

            if (DEBUG_MODE) client.logger.debug(`[Lavalink PlayerUpdate] Saved new player data for guild ${newPlayer.guildId}`);
        }
    },
});
