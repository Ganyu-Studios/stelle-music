import type { PlayerJson } from "hoshimi";
import { EventNames } from "hoshimi";
import type { SessionJson } from "#stelle/types";
import { Constants } from "#stelle/utils/data/constants.js";
import { omitKeys } from "#stelle/utils/functions/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerUpdate,
    async run(client, newPlayer, oldPlayer): Promise<void> {
        if (!client.config.sessions.enabled) return;

        const newPlayerJson: PlayerJson = newPlayer.toJSON();

        if (
            !oldPlayer ||
            oldPlayer.voiceId !== newPlayerJson.voiceId ||
            oldPlayer.textId !== newPlayerJson.textId ||
            oldPlayer.options.selfDeaf !== newPlayerJson.options.selfDeaf ||
            oldPlayer.options.selfMute !== newPlayerJson.options.selfDeaf ||
            oldPlayer.node.id !== newPlayerJson.node.id ||
            oldPlayer.node.sessionId !== newPlayerJson.node.sessionId
        ) {
            if (newPlayerJson.queue?.current) newPlayerJson.queue.current.userData = {};

            const newJson = omitKeys(newPlayerJson, [
                "ping",
                "createdTimestamp",
                "lastPositionUpdate",
                "paused",
                "playing",
                "queue",
                "filters",
            ]);

            const messageId = await newPlayer.data.get("messageId");
            const enabledAutoplay = await newPlayer.data.get("enabledAutoplay");
            const localeString = await newPlayer.data.get("localeString");
            const me = await newPlayer.data.get("me");
            const lyricsId = await newPlayer.data.get("lyricsId");
            const lyricsEnabled = await newPlayer.data.get("lyricsEnabled");
            const is247 = await newPlayer.data.get("is247");
            const isAutoPause = await newPlayer.data.get("isAutoPause");

            Sessions.set<SessionJson>(newPlayer.guildId, {
                ...newJson,
                messageId,
                enabledAutoplay,
                localeString,
                me,
                lyricsId,
                lyricsEnabled,
                is247,
                isAutoPause,
            });

            if (Constants.Debug)
                client.debugger?.info(
                    `[Session ${newPlayer.guildId}] Updated Session: ${JSON.stringify(Sessions.get<SessionJson>(newPlayer.guildId))}`,
                );
        }
    },
});
