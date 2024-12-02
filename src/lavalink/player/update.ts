import type { ClientUser } from "seyfert";
import { Lavalink, sessions } from "#stelle/classes";
import type { StellePlayerJson } from "#stelle/types";

import { DEBUG_MODE } from "#stelle/data/Constants.js";

export default new Lavalink({
    name: "playerUpdate",
    type: "manager",
    run: (client, oldPlayer, newPlayer) => {
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

            sessions.set<StellePlayerJson>(newPlayer.guildId, {
                ...newPlayerJson,
                messageId: newPlayer.get("messageId"),
                enabledAutoplay: newPlayer.get("enabledAutoplay"),
                localeString: newPlayer.get<string | undefined>("localeString"),
                me: newPlayer.get<ClientUser | undefined>("me"),
            });

            return DEBUG_MODE && client.logger.debug(`[Lavalink PlayerUpdate] Saved new player data for guild ${newPlayer.guildId}`);
        }
    },
});
