import type { ClientUser } from "seyfert";
import { Lavalink, sessions } from "#stelle/classes";
import type { StellePlayerJson } from "#stelle/types";

import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "playerUpdate",
    type: "manager",
    run: (client, oldPlayer, newPlayer) => {
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
                ...newJson
            } = newPlayerJson;

            sessions.set<StellePlayerJson>(newPlayer.guildId, {
                ...newJson,
                messageId: newPlayer.get("messageId"),
                enabledAutoplay: newPlayer.get("enabledAutoplay"),
                localeString: newPlayer.get<string | undefined>("localeString"),
                me: newPlayer.get<ClientUser | undefined>("me"),
            });

            return DEBUG_MODE && client.logger.debug(`[Lavalink PlayerUpdate] Saved new player data for guild ${newPlayer.guildId}`);
        }
    },
});
