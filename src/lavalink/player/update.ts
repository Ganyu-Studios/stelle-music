import type { PlayerJSON } from "hoshimi";
import { EventNames } from "hoshimi";
import type { NonOptionsNode, SessionJson, TrackUser } from "#stelle/types";
import { StelleMeta } from "#stelle/utils/data/constants.js";
import { omitKeys } from "#stelle/utils/functions/utils.js";
import { createLavalinkEvent } from "#stelle/utils/manager/events.js";
import { Sessions } from "#stelle/utils/manager/sessions.js";

export default createLavalinkEvent({
    name: EventNames.PlayerUpdate,
    async run(client, newPlayer, oldPlayer): Promise<void> {
        if (!client.config.sessions.enabled) return;

        const newPlayerJson: PlayerJSON = newPlayer.toJSON();

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
                "node",
            ]);

            const node: NonOptionsNode = omitKeys(newPlayerJson.node, ["options"]);

            const messageId: string | undefined = await newPlayer.data.get("messageId");
            const enabledAutoplay: boolean | undefined = await newPlayer.data.get("enabledAutoplay");
            const localeString: string | undefined = await newPlayer.data.get("localeString");
            const me: TrackUser | undefined = await newPlayer.data.get("me");
            const lyricsId: string | undefined = await newPlayer.data.get("lyricsId");
            const lyricsEnabled: boolean | undefined = await newPlayer.data.get("lyricsEnabled");
            const is247: boolean | undefined = await newPlayer.data.get("is247");
            const isAutoPause: boolean | undefined = await newPlayer.data.get("isAutoPause");

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
                node,
            });

            if (StelleMeta.Debug)
                client.debugger?.info(
                    `[Lavalink] Session updated | guild: ${newPlayer.guildId} | node: ${node.id} | voice: ${newJson.voiceId} | text: ${newJson.textId}`,
                );
        }
    },
});
