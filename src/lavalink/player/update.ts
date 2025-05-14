import type { PlayerJson } from "lavalink-client";
import { LavalinkEventTypes, type SessionJson, type StelleUser } from "#stelle/types";
import { omitKeys } from "#stelle/utils/functions/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";

import { Constants } from "#stelle/utils/data/constants.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: "playerUpdate",
    type: LavalinkEventTypes.Manager,
    run(client, oldPlayer, newPlayer): void {
        if (!client.config.sessions.enabled) return;

        const newPlayerJson: PlayerJson = newPlayer.toJSON();

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

            const newJson = omitKeys(newPlayerJson, [
                "ping",
                "createdTimeStamp",
                "lavalinkVolume",
                "equalizer",
                "lastPositionChange",
                "paused",
                "playing",
                "queue",
                "filters",
            ]);

            Sessions.set<SessionJson>(newPlayer.guildId, {
                ...newJson,
                messageId: newPlayer.get("messageId"),
                enabledAutoplay: newPlayer.get("enabledAutoplay"),
                localeString: newPlayer.get<string | undefined>("localeString"),
                me: newPlayer.get<StelleUser | undefined>("me"),
                lyricsId: newPlayer.get<string | undefined>("lyricsId"),
                lyricsEnabled: newPlayer.get<boolean | undefined>("lyricsEnabled"),
            });

            if (Constants.Debug)
                client.logger.debug(
                    `Session: ${newPlayer.guildId} | Updated Session: ${JSON.stringify(Sessions.get<SessionJson>(newPlayer.guildId))}`,
                );
        }
    },
});
